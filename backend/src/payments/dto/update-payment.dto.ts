import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsIn(['pending', 'paid', 'failed', 'refunded'])
  status?: string;

  @IsOptional()
  @IsString()
  payment_link?: string;

  @IsOptional()
  @IsString()
  payment_provider?: string;

  @IsOptional()
  @IsString()
  payment_provider_id?: string;

  @IsOptional()
  @IsDateString()
  paid_at?: string;
}

