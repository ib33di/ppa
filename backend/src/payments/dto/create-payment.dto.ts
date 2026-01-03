import { IsUUID, IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  invitation_id: string;

  @IsUUID()
  match_id: string;

  @IsUUID()
  player_id: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  payment_link?: string;

  @IsOptional()
  @IsString()
  payment_provider?: string;
}

