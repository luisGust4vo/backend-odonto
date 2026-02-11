import {
  Equals,
  IsBoolean,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsBoolean()
  @Equals(true, { message: 'Você deve aceitar os termos e a política de privacidade' })
  termsAccepted: boolean;
}
