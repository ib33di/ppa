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

    console.log('🔐 Login attempt for user:', { 
      userId: data.user.id, 
      email: data.user.email 
    });

    // Get role from user_profiles table using SERVICE_ROLE_KEY (bypasses RLS)
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('role, name')
      .eq('id', data.user.id)
      .single();

    console.log('📋 Profile fetch result:', { 
      profile, 
      profileError: profileError ? {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      } : null,
      userId: data.user.id 
    });

    let userRole = 'user';
    let userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';

    if (profile && !profileError) {
      // Profile exists and fetched successfully
      userRole = profile.role || 'user';
      userName = profile.name || userName;
      console.log('✅ Using profile role:', { role: userRole, name: userName });
    } else if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('⚠️ Profile not found, creating new profile...');
        const defaultRole = data.user.user_metadata?.role || 'user';
        const { data: newProfile, error: insertError } = await this.supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            name: userName,
            role: defaultRole,
          })
          .select()
          .single();
        
        if (newProfile && !insertError) {
          userRole = newProfile.role;
          userName = newProfile.name || userName;
          console.log('✅ Created new profile:', { role: userRole, name: userName });
        } else {
          console.error('❌ Failed to create profile:', insertError);
          userRole = defaultRole;
        }
      } else {
        // Other error (RLS, permissions, etc.)
        console.error('❌ Error fetching profile:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details
        });
        // Try to use user_metadata as fallback
        userRole = data.user.user_metadata?.role || 'user';
      }
    }
    
    // Don't use 'authenticated' as role
    if (userRole === 'authenticated') {
      userRole = 'user';
    }

    console.log('🎯 Final role for login:', { 
      email: data.user.email, 
      role: userRole,
      userId: data.user.id
    });

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
        name: userName,
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
    console.log('🔍 getProfile called for userId:', userId);
    
    // Get profile directly from user_profiles table using SERVICE_ROLE_KEY
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('role, name, id')
      .eq('id', userId)
      .single();

    console.log('📋 getProfile result:', { 
      profile, 
      profileError: profileError ? {
        message: profileError.message,
        code: profileError.code
      } : null
    });

    if (profile && !profileError) {
      const result = {
        id: profile.id,
        email: '', // Will be filled from JWT payload
        role: profile.role || 'user',
        name: profile.name || 'User',
      };
      console.log('✅ getProfile returning:', result);
      return result;
    }

    // If profile doesn't exist or error, return default
    console.warn('⚠️ Profile not found for user:', userId);
    return {
      id: userId,
      email: '',
      role: 'user',
      name: 'User',
    };
  }
}

