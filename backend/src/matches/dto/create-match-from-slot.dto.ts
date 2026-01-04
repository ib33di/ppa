import { IsString, IsUUID, IsDateString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateMatchFromSlotDto {
  @IsUUID()
  court_id: string;

  @IsDateString()
  scheduled_time: string;

  @IsOptional()
  @IsString()
  slot_time?: string; // HH:MM

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
