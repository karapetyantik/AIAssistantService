import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ScheduleMessageDto } from './dto/schedule-message.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prismaService: PrismaService) {}

  async scheduleMessage(userId: string, dto: ScheduleMessageDto) {
    const sendAt = new Date(dto.sendAt);

    if (sendAt.getTime() <= Date.now()) {
      throw new BadRequestException('Время отправки должно быть в будущем');
    }

    return this.prismaService.scheduledMessage.create({
      data: { userId, chatId: dto.chatId, content: dto.content, sendAt },
    });
  }

  async listScheduled(userId: string) {
    return this.prismaService.scheduledMessage.findMany({
      where: { userId, status: 'pending' },
      orderBy: { sendAt: 'asc' },
    });
  }

  async cancelScheduled(userId: string, id: string) {
    const message = await this.prismaService.scheduledMessage.findUnique({
      where: { id },
    });

    if (!message || message.userId !== userId) {
      throw new NotFoundException('Отложенное сообщение не найдено');
    }
    if (message.status !== 'pending') {
      throw new BadRequestException(
        'Это сообщение уже отправлено или отменено',
      );
    }

    return this.prismaService.scheduledMessage.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
