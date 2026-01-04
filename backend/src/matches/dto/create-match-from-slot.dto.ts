import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, Matches } from 'class-validator';

/**
 * DTO for slot-driven match creation.
 *
 * NOTE: `slot_time` is intentionally NOT a DB column on `matches`.
 * It's only used for availability validation in local HH:MM format.
 */
export class CreateMatchFromSlotDto {
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
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'slot_time must be in HH:MM format' })
  slot_time?: string;
}

