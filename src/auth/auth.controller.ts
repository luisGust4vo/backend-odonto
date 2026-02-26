import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post(['auth/register', 'register'])
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post(['auth/login', 'login']) 
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
