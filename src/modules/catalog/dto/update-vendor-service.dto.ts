import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateVendorServiceDto {
  @IsOptional()
  @Transform(({ value }) => (value == null || value === undefined ? value : String(value)))
  @IsString()
  @MaxLength(32)
  price?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
