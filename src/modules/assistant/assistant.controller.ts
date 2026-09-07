import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/auth/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import { SuggestReplyDto } from './dto/suggest-reply.dto';

@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('suggest-replies')
  async suggestReplies(@Body() dto: SuggestReplyDto) {
    return this.assistantService.suggestReplies(dto);
  }
}
