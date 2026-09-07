import { Logger, BadRequestException } from '@nestjs/common';
import {
  DEFAULT_GENERATE_OPTIONS,
  GenerateOptions,
  ModelProvider,
} from './model-provider.interface';

export abstract class BaseModelProvider implements ModelProvider {
  protected abstract readonly logger: Logger;
  protected abstract readonly providerName: string;

  async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: GenerateOptions,
  ): Promise<string> {
    const resolved: Required<GenerateOptions> = {
      ...DEFAULT_GENERATE_OPTIONS,
      ...options,
    };

    try {
      return await this.doGenerate(systemPrompt, userPrompt, resolved);
    } catch (error) {
      this.logger.error(`${this.providerName} request failed: ${error}`);
      throw new BadRequestException('Сервис подсказок временно недоступен');
    }
  }

  protected abstract doGenerate(
    systemPrompt: string,
    userPrompt: string,
    options: Required<GenerateOptions>,
  ): Promise<string>;
}
