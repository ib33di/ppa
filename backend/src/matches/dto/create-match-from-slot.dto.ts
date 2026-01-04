import { IsString, IsUUID, IsDateString, IsOptional, IsInt, Min, Matches } from 'class-validator';

export class CreateMatchFromSlotDto {
  @IsUUID()
  court_id: string;

  @IsDateString()
  scheduled_time: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'slot_time must be in HH:MM format' })
  slot_time?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  target_count?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}
