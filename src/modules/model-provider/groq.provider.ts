import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ModelProvider } from './model-provider.interface';

@Injectable()
export class GroqProvider implements ModelProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({
      apiKey: this.configService.getOrThrow<string>('GROQ_API_KEY'),
    });
    this.model = this.configService.getOrThrow<string>(
      'GROQ_MODEL',
      'qwen/qwen3.8-27b',
    );
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error(`Groq API вернул ошибку: ${error}`);
      throw new BadRequestException('Сервис подсказок временно недоступен');
    }
  }
}
