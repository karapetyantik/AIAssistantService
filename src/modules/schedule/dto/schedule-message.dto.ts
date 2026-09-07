import {
  IsDateString,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ScheduleMessageDto {
  @IsUUID()
  chatId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @IsDateString()
  sendAt!: string;
}
