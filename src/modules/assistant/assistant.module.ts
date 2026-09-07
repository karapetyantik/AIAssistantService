import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { RedisModule } from '@common/redis/redis.module';
import { ModelProviderModule } from '@modules/model-provider/model-provider.module';
import { ScheduleModule } from '@modules/schedule/schedule.module';

@Module({
  imports: [RedisModule, ModelProviderModule, ScheduleModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
