import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';

@Module({
  imports: [HttpModule],
  providers: [
    GroqProvider,
    OllamaProvider,
    {
      provide: 'MODEL_PROVIDER',
      useFactory: (
        config: ConfigService,
        groq: GroqProvider,
        ollama: OllamaProvider,
      ) => {
        return config.get<string>('AI_PROVIDER', 'groq') === 'ollama'
          ? ollama
          : groq;
      },
      inject: [ConfigService, GroqProvider, OllamaProvider],
    },
  ],
  exports: ['MODEL_PROVIDER'],
})
export class ModelProviderModule {}
