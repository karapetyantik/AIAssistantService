import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ContextMessageDto {
  @IsIn(['me', 'other'])
  role!: 'me' | 'other';

  @IsString()
  content!: string;
}

export class SuggestReplyDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ContextMessageDto)
  messages!: ContextMessageDto[];

  @IsOptional()
  @IsIn(['casual', 'formal', 'friendly'])
  tone?: 'casual' | 'formal' | 'friendly';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  chatId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  participantName?: string;
}
