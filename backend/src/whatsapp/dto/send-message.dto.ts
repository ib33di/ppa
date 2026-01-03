import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  whatsapp_account_id: number;

  @IsString()
  to: string;

  @IsString()
  message: string;
}

