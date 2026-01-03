import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsIn(['Left', 'Right', 'Both'])
  position?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  trust_score?: number;

  @IsOptional()
  @IsIn(['Trusted', 'Stable', 'Inconsistent', 'Risk'])
  reliability_status?: string;

  @IsOptional()
  @IsIn(['Instant', 'Normal', 'Slow'])
  confirmation_speed?: string;

  @IsOptional()
  @IsIn(['Positive', 'Neutral', 'Mixed'])
  feedback_signal?: string;

  @IsOptional()
  @IsIn(['Calm', 'Neutral', 'Intense'])
  energy?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  repeat_rate?: number;
}

