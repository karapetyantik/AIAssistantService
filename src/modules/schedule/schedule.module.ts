import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleRunnerService } from './schedule-runner.service';
import { ChatGrpcClientModule } from '@modules/chat-grpc-client/chat-grpc-client.module';
import { PrismaModule } from '@common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ChatGrpcClientModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleRunnerService],
})
export class ScheduleModule {}
