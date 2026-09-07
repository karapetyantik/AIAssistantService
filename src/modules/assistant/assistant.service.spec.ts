import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { RedisService } from '@common/redis/redis.service';
import type { ModelProvider } from '@modules/model-provider/model-provider.interface';
import { SuggestReplyDto } from './dto/suggest-reply.dto';

describe('AssistantService', () => {
  let service: AssistantService;
  let modelProvider: jest.Mocked<ModelProvider>;

  const baseDto: SuggestReplyDto = {
    messages: [{ role: 'other', content: 'Привет!' }],
  };

  beforeEach(async () => {
    modelProvider = { generate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistantService,
        {
          provide: RedisService,
          useValue: { client: { get: jest.fn(), set: jest.fn() } },
        },
        { provide: 'MODEL_PROVIDER', useValue: modelProvider },
      ],
    }).compile();

    service = module.get(AssistantService);
  });

  it('parses a well-formed { replies: [...] } JSON response', async () => {
    modelProvider.generate.mockResolvedValue(
      '{"replies": ["Привет!", "Как дела?", "Что нового?"]}',
    );

    await expect(service.suggestReplies(baseDto)).resolves.toEqual([
      'Привет!',
      'Как дела?',
      'Что нового?',
    ]);
  });

  it('strips markdown code fences before parsing JSON', async () => {
    modelProvider.generate.mockResolvedValue(
      '```json\n{"replies": ["Ок", "Понял", "Спасибо"]}\n```',
    );

    await expect(service.suggestReplies(baseDto)).resolves.toEqual([
      'Ок',
      'Понял',
      'Спасибо',
    ]);
  });

  it('recovers a bare JSON array embedded in prose', async () => {
    modelProvider.generate.mockResolvedValue(
      'Вот варианты: ["Первый", "Второй", "Третий"] — надеюсь, подойдёт',
    );

    await expect(service.suggestReplies(baseDto)).resolves.toEqual([
      'Первый',
      'Второй',
      'Третий',
    ]);
  });

  it('falls back to line-based parsing for non-JSON numbered output', async () => {
    modelProvider.generate.mockResolvedValue(
      '1. Первый вариант\n2. Второй вариант\n3. Третий вариант',
    );

    await expect(service.suggestReplies(baseDto)).resolves.toEqual([
      'Первый вариант',
      'Второй вариант',
      'Третий вариант',
    ]);
  });

  it('throws BadRequestException when nothing usable can be extracted', async () => {
    modelProvider.generate.mockResolvedValue('x');

    await expect(service.suggestReplies(baseDto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
