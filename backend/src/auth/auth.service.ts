import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Use Supabase Auth
    const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get role from user_profiles table
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .select('role, name')
      .eq('id', data.user.id)
      .single();

    const userRole = profile?.role || data.user.user_metadata?.role || 'user';

    // Generate JWT token
    const payload = {
      sub: data.user.id,
      email: data.user.email,
      role: userRole,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        name: profile?.name || data.user.user_metadata?.name,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, role = 'user' } = registerDto;

    // Create user in Supabase Auth
    const { data, error } = await this.supabase.getClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error || !data.user) {
      throw new UnauthorizedException(error?.message || 'Registration failed');
    }

    // Generate JWT token
    const payload = {
      sub: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'user',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
        name: data.user.user_metadata?.name,
      },
    };
  }

  async validateUser(userId: string) {
    // Get user from Supabase Auth
    const { data: { user }, error } = await this.supabase.getClient().auth.getUser(userId);

    if (error || !user) {
      return null;
    }

    // Get role from user_profiles table
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .select('role, name')
      .eq('id', userId)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || user.user_metadata?.role || 'user',
      name: profile?.name || user.user_metadata?.name,
    };
  }

  async getProfile(userId: string) {
    const user = await this.validateUser(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}

