import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [HttpModule, RedisModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
