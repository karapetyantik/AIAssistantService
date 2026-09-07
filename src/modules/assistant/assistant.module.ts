import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { RedisModule } from '@common/redis/redis.module';
import { ModelProviderModule } from '@modules/model-provider/model-provider.module';

@Module({
  imports: [RedisModule, ModelProviderModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
