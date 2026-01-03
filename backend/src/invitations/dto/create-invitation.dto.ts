import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  match_id: string;

  @IsUUID()
  player_id: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  whatsapp_message_id?: string;

  @IsOptional()
  @IsBoolean()
  is_backup?: boolean;
}

