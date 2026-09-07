import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/auth/jwt-auth.guard';
import { ScheduleService } from './schedule.service';
import { ScheduleMessageDto } from './dto/schedule-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('assistant/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  schedule(@Req() req: any, @Body() dto: ScheduleMessageDto) {
    return this.scheduleService.scheduleMessage(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.scheduleService.listScheduled(req.user.userId);
  }

  @Delete(':id')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.scheduleService.cancelScheduled(req.user.userId, id);
  }
}
