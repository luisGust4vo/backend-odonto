import { IsBoolean, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @IsISO8601()
  start: string;

  @IsOptional()
  @IsISO8601()
  end?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  calendar?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;
}
