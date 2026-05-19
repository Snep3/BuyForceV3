import { IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  address?: string;

  @IsOptional()
  @ValidateIf((o) => o.avatarUrl !== '' && o.avatarUrl != null)
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string | null;
}
