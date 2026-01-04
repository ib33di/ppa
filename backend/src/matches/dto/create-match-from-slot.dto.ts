import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

/**
 * Payload for POST /matches/create.
 *
 * `slot_time` is an auxiliary field (HH:MM) used for availability validation and
 * must NOT be inserted into the `matches` table.
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

