import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.adminSupabase;
  }

  async signUp(email: string, password: string, metadata: any = {}) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw new BadRequestException(error.message || "Failed to sign up");
    }

    return data;
  }

  async createUserWithAdmin(
    email: string,
    password?: string,
    metadata: any = {},
  ) {
    const { data, error } = await this.adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: false,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name,
      email_verified: !!data.user.email_confirmed_at,
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message || "Failed to sign in");
    }
    console.log(data);

    return data;
  }

  async verifyOtp(
    email: string,
    token: string,
    type: "signup" | "email" | "recovery",
  ) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: type as any,
    });

    if (error) {
      throw new BadRequestException(
        error.message || "Invalid or expired OTP code",
      );
    }

    if (!data.user || !data.session) {
      throw new UnauthorizedException("User not found or session not created");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name,
        email_verified: !!data.user.email_confirmed_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  }

  async sendVerificationEmail(email: string) {
    const { error } = await this.supabase.auth.resend({
      type: "signup",
      email,
    });

    return { error };
  }

  async generateMagicLink(email: string): Promise<string | null> {
    const { data, error } = await this.adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (error) {
      console.error("Failed to generate magic link:", error);
      return null;
    }

    return data.properties?.hashed_token || null;
  }

  async validateToken(token: string) {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException("Invalid token");
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name,
      email_verified: !!user.email_confirmed_at,
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException(
        error.message || "Failed to refresh token",
      );
    }

    return data;
  }

  async getUserFromToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException(error?.message || "Invalid token");
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name,
      email_verified: !!data.user.email_confirmed_at,
    };
  }

  async sendPasswordResetOtp(email: string) {
    const { data, error } =
      await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new BadRequestException(
        error.message || "Failed to send reset OTP",
      );
    }

    return data;
  }

  async verifyPasswordResetOtp(email: string, token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (error) {
      throw new BadRequestException(error.message || "Invalid reset OTP");
    }

    return data;
  }

  async updateUserPassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new BadRequestException(
        error.message || "Failed to update password",
      );
    }

    return data;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.adminSupabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Failed to delete user from Supabase:", error);
    }
  }
}
