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
    // Get profile from user_profiles table (most reliable source for role)
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('role, name, id')
      .eq('id', userId)
      .single();

    if (profile && !profileError) {
      // Profile exists, get email from auth.users table (public schema)
      // Note: We can't directly query auth.users, so we'll use the profile data
      // Email will be retrieved from JWT token payload if needed
      return {
        id: profile.id,
        email: '', // Will be filled from JWT token
        role: profile.role || 'user',
        name: profile.name || 'User',
      };
    }

    // Profile doesn't exist - this shouldn't happen if login worked correctly
    // Return default user
    return {
      id: userId,
      email: '',
      role: 'user',
      name: 'User',
    };
  }

  async getProfile(userId: string) {
    // Get profile directly from user_profiles table
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('role, name, id')
      .eq('id', userId)
      .single();

    if (profile && !profileError) {
      // Get email from JWT payload if available, otherwise use empty string
      // The email should be in the JWT token payload
      return {
        id: profile.id,
        email: '', // Will be filled from request context if needed
        role: profile.role || 'user',
        name: profile.name || 'User',
      };
    }

    // If profile doesn't exist, return default
    return {
      id: userId,
      email: '',
      role: 'user',
      name: 'User',
    };
  }
}

