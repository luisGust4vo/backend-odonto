import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchProductsDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  q = '';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(8)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : Array.isArray(value)
        ? value
        : undefined,
  )
  @IsArray()
  @IsString({ each: true })
  sources?: string[];
}
