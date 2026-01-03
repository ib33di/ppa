import { IsString, IsUUID, IsDateString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateMatchDto {
  @IsUUID()
  court_id: string;

  @IsDateString()
  scheduled_time: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  target_count?: number;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}

