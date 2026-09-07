import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@common/prisma/prisma.service';
import { ChatGrpcClientService } from '@modules/chat-grpc-client/chat-grpc-client.service';

@Injectable()
export class ScheduleRunnerService {
  private readonly logger = new Logger(ScheduleRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGrpcClient: ChatGrpcClientService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processDueMessages() {
    const due = await this.prisma.scheduledMessage.findMany({
      where: { status: 'pending', sendAt: { lte: new Date() } },
      take: 50,
    });

    for (const message of due) {
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

    if (due.length > 0) {
      this.logger.log(`Обработано отложенных сообщений: ${due.length}`);
    }
  }
}
