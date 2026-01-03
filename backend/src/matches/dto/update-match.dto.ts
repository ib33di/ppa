import { PartialType } from '@nestjs/mapped-types';
import { CreateMatchDto } from './create-match.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @IsOptional()
  @IsDateString()
  locked_at?: string;

  @IsOptional()
  @IsDateString()
  completed_at?: string;
}

