import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { ChatGrpcClientService } from '@modules/chat-grpc-client/chat-grpc-client.service';

const LOCK_KEY = 'assistant:schedule-runner:lock';
const LOCK_TTL_MS = 25_000;

@Injectable()
export class ScheduleRunnerService {
  private readonly logger = new Logger(ScheduleRunnerService.name);
  private readonly instanceId = randomUUID();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly chatGrpcClient: ChatGrpcClientService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processDueMessages() {
    const acquired = await this.redisService.client.set(
      LOCK_KEY,
      this.instanceId,
      'PX',
      LOCK_TTL_MS,
      'NX',
    );
    if (!acquired) {
      return;
    }

    try {
      const due = await this.prisma.scheduledMessage.findMany({
        where: { status: 'pending', sendAt: { lte: new Date() } },
        take: 50,
      });

      let processed = 0;
      for (const message of due) {
        try {
          await this.processMessage(message);
          processed++;
        } catch (error) {
          this.logger.error(
            `Не удалось обработать отложенное сообщение ${message.id}: ${error}`,
          );
        }
      }

      if (processed > 0) {
        this.logger.log(`Обработано отложенных сообщений: ${processed}`);
      }
    } finally {
      await this.releaseLockIfOwned();
    }
  }

  private async processMessage(message: {
    id: string;
    chatId: string;
    userId: string;
    content: string;
  }) {
    const stillMember = await this.chatGrpcClient.isMember(
      message.chatId,
      message.userId,
    );

    if (!stillMember) {
      await this.prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          error: 'Пользователь больше не состоит в этом чате',
        },
      });
      return;
    }

    const result = await this.chatGrpcClient.sendMessageInternal(
      message.chatId,
      message.userId,
      message.content,
    );

    await this.prisma.scheduledMessage.update({
      where: { id: message.id },
      data: result.success
        ? { status: 'sent', sentAt: new Date() }
        : { status: 'failed', error: result.error },
    });
  }

  private async releaseLockIfOwned() {
    const current = await this.redisService.client.get(LOCK_KEY);
    if (current === this.instanceId) {
      await this.redisService.client.del(LOCK_KEY);
    }
  }
}
