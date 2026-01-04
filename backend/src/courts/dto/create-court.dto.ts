import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';

class CourtAvailabilityRangeDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start_time: string; // HH:MM (24h)

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end_time: string; // HH:MM (24h)
}

export class CreateCourtDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  /**
   * Optional allowed play hours for this court.
   * Future-proofed for multiple daily ranges (e.g. 07:00-12:00 and 16:00-23:30).
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourtAvailabilityRangeDto)
  availability?: CourtAvailabilityRangeDto[];
}

