import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from 'src/common/redis/redis.module';
import { ModelProviderModule } from '../model-provider/model-provider.module';

@Module({
  imports: [RedisModule, ModelProviderModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
