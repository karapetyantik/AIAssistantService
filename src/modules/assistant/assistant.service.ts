import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SuggestReplyDto } from './dto/suggest-reply.dto';
import { RedisService } from 'src/common/redis/redis.service';

interface AssistantContext {
  participantName?: string;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async suggestReplies(dto: SuggestReplyDto): Promise<string[]> {
    const context = await this.resolveContext(dto);
    const prompt = this.buildPrompt(dto, context);

    const rawResponse = await this.callModel(prompt);
    return this.parseSuggestions(rawResponse);
  }

  private async resolveContext(
    dto: SuggestReplyDto,
  ): Promise<AssistantContext> {
    if (!dto.chatId) {
      return { participantName: dto.participantName };
    }

    const cacheKey = `assistant_context:${dto.chatId}`;

    if (dto.participantName) {
      await this.redisService.client.set(
        cacheKey,
        JSON.stringify({ participantName: dto.participantName }),
        'EX',
        3600,
      );
      return { participantName: dto.participantName };
    }

    const cached = await this.redisService.client.get(cacheKey);
    return cached ? JSON.parse(cached) : {};
  }

  private buildPrompt(dto: SuggestReplyDto, context: AssistantContext): string {
    const toneInstruction = {
      casual: 'непринуждённым, разговорным тоном',
      formal: 'вежливым, официальным тоном',
      friendly: 'тёплым, дружелюбным тоном',
    }[dto.tone ?? 'casual'];

    const conversationText = dto.messages
      .map(
        (m) =>
          `${m.role === 'me' ? 'Я' : (context.participantName ?? 'Собеседник')}: ${m.content}`,
      )
      .join('\n');

    return `Ты помогаешь человеку быстро ответить в переписке в мессенджере.

          ГЛАВНОЕ ПРАВИЛО ЯЗЫКА:
          Определи язык и алфавит ПОСЛЕДНЕГО сообщения собеседника и отвечай СТРОГО на том же языке и в той же письменности.
          Правила по языкам:
          - Если сообщение на русском — отвечай на русском.
          - Если на английском — отвечай на английском.
          - Если на испанском — отвечай на испанском.
          - Если на японском — отвечай на японском.
          - Если на армянском (армянскими буквами) — отвечай армянскими буквами.
          - Если армянский язык написан ЛАТИНСКИМИ буквами (транслитерация, например "barev", "inchpes es", "vonc es", "shat lav") — отвечай ТОЖЕ армянским языком, но ЛАТИНСКИМИ буквами, в том же стиле транслитерации. НЕ переводи на английский, НЕ переключайся на армянский алфавит.

          Пример транслитерации армянского: "Barev, inchpes es?" → подходящий ответ: "Barev ${context.participantName ?? ''}, lav em, du inchpes es?" (не "Hello, how are you?" и не "Բարև, ինչպես ես?")

          ЗАДАЧА:
          Предложи РОВНО 3 коротких, естественных варианта ответа от лица "Я" на последнее сообщение собеседника, ${toneInstruction}.

          ФОРМАТ ОТВЕТА:
          Ответь СТРОГО валидным JSON-массивом из 3 строк, без каких-либо пояснений до или после.
          Пример правильного формата ответа: ["Все супер, до встречи!", "Хорошо, договорились", "Отлично, увидимся"]
          НЕПРАВИЛЬНО (не делай так): {"вариант 1": "вариант 2"} — это объект, а не массив.

          Переписка:
          ${conversationText}

          Варианты ответа (JSON-массив):`;
  }

  private async callModel(prompt: string): Promise<string> {
    const url = `${this.configService.getOrThrow<string>('OLLAMA_URL')}/api/generate`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
          model: this.configService.getOrThrow<string>('OLLAMA_MODEL'),
          prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.3 },
        }),
      );

      const raw = response.data.response;
      this.logger.debug(`RAW: ${raw}`);
      return raw;
    } catch (error) {
      this.logger.error(
        `Ollama недоступна или вернула ошибку: ${error.message}`,
      );
      throw new BadRequestException('Сервис подсказок временно недоступен');
    }
  }

  private parseSuggestions(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      const extracted = this.extractArrayFromJson(parsed);
      if (extracted) return extracted;
    } catch {}

    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        const extracted = this.extractArrayFromJson(parsed);
        if (extracted) return extracted;
      } catch {}
    }

    const lines = raw
      .split('\n')
      .map((line) =>
        line
          .replace(/^[\d.\-\*\)\s"]+/, '')
          .replace(/["\s]+$/, '')
          .trim(),
      )
      .filter(
        (line) =>
          line.length > 3 &&
          line.length < 200 &&
          !line.includes('{') &&
          !line.includes('['),
      );

    if (lines.length >= 2) {
      this.logger.warn(
        'Модель не вернула JSON, использован построчный разбор как fallback',
      );
      return lines.slice(0, 3);
    }

    this.logger.error(
      `Не удалось разобрать ответ модели даже через fallback: ${raw}`,
    );

    throw new BadRequestException(
      'Не удалось сгенерировать подсказки, попробуйте ещё раз',
    );
  }

  private collectStrings(value: unknown, acc: string[] = []): string[] {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 3 && trimmed.length < 300) {
        acc.push(trimmed);
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        this.collectStrings(item, acc);
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        this.collectStrings(key, acc); // ключ объекта тоже может быть кандидатом на ответ
        this.collectStrings(val, acc);
      }
    }
    return acc;
  }

  private extractArrayFromJson(parsed: unknown): string[] | null {
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return parsed.slice(0, 3);
    }

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      const values = Object.values(parsed);

      if (values.length >= 2 && values.every((v) => typeof v === 'string')) {
        // Модель обернула ответы в объект вида {"Вариант 1": "...", "Вариант 2": "..."} —
        // ключи здесь просто ярлыки, реальный контент — в значениях
        const uniqueValues = [...new Set(values as string[])]
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (uniqueValues.length >= 2) {
          return uniqueValues.slice(0, 3);
        }
      }
    }

    const collected = [...new Set(this.collectStrings(parsed))];
    return collected.length >= 2 ? collected.slice(0, 3) : null;
  }
}
