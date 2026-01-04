import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateInvitationDto {
  @IsOptional()
  @IsIn(['pending', 'invited', 'confirmed', 'declined', 'timeout', 'backup'])
  status?: string;

  @IsOptional()
  @IsString()
  whatsapp_message_id?: string;

  @IsOptional()
  @IsString()
  sent_at?: string;
}

