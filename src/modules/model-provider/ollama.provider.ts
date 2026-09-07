import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ModelProvider } from './model-provider.interface';

@Injectable()
export class OllamaProvider implements ModelProvider {
  private readonly logger = new Logger(OllamaProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `${this.configService.getOrThrow<string>('OLLAMA_URL')}/api/generate`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
          model: this.configService.getOrThrow<string>('OLLAMA_MODEL'),
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          format: 'json',
          options: { temperature: 0.7 },
        }),
      );
      return response.data.response;
    } catch (error) {
      this.logger.error(`Ollama недоступна: ${error}`);
      throw new BadRequestException('Сервис подсказок временно недоступен');
    }
  }
}
