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
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('role, name')
      .eq('id', data.user.id)
      .single();

    // If profile doesn't exist, create it
    let userRole = profile?.role || data.user.user_metadata?.role || 'user';
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile } = await this.supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          role: userRole,
        })
        .select()
        .single();
      
      if (newProfile) {
        userRole = newProfile.role;
      }
    }
    
    // Don't use 'authenticated' as role
    if (userRole === 'authenticated') {
      userRole = 'user';
    }

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

    // Create user profile in user_profiles table
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        name: name || data.user.email?.split('@')[0] || 'User',
        role: role,
      })
      .select()
      .single();

    const userRole = profile?.role || role;

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
        name: profile?.name || name || data.user.email?.split('@')[0] || 'User',
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
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('role, name')
      .eq('id', userId)
      .single();

    // If profile doesn't exist, create it with default role
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const defaultRole = user.user_metadata?.role || 'user';
      await this.supabase
        .from('user_profiles')
        .insert({
          id: userId,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: defaultRole,
        })
        .select()
        .single();
      
      return {
        id: user.id,
        email: user.email,
        role: defaultRole,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      };
    }

    // Use profile role, fallback to user_metadata, then default to 'user'
    const userRole = profile?.role || user.user_metadata?.role || 'user';
    
    // Don't use 'authenticated' as role - it's a Supabase auth status, not a user role
    const finalRole = userRole === 'authenticated' ? 'user' : userRole;

    return {
      id: user.id,
      email: user.email,
      role: finalRole,
      name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
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

