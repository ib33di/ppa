import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    console.log('📥 getProfile request:', { 
      userId: req.user.sub, 
      email: req.user.email, 
      role: req.user.role,
      fullUser: req.user
    });
    
    const profile = await this.authService.getProfile(req.user.sub);
    
    const result = {
      ...profile,
      email: req.user.email || profile.email || '',
      role: profile.role || req.user.role || 'user',
    };
    
    console.log('📤 getProfile response:', result);
    return result;
  }
}

