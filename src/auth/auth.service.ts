import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SignUpDto, SignInDto, GoogleAuthDto } from './dto/auth.dto';
import { generateRandomCode } from '../util/random.util';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, name } = signUpDto;

    const supabaseAdmin = this.supabaseService.getAdminClient();

    // Create user in Supabase
    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: false,
        user_metadata: { name },
      },
    );

    if (error) {
      if (error.message.includes('already registered')) {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException(error.message);
    }

    try {
      // Create user in Prisma
      const user = await this.prisma.user.create({
        data: {
          id: authUser.user.id,
          email,
          name,
          referralCode: generateRandomCode(),
        },
      });

      if (user.referredByUserId) {
        await this.prisma.referral.create({
          data: {
            referrerUserId: user.referredByUserId,
            referredUserId: user.id,
          },
        });
      }

      return { user: this.formatUser(user), needsVerification: true };
    } catch (error) {
      // Cleanup Supabase user if Prisma fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: this.formatUser(user),
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    };
  }

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    const { idToken } = googleAuthDto;

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { email, name, email_verified } = payload;

    if (!email || !email_verified) {
      throw new UnauthorizedException('Email is required and must be verified');
    }

    // Check if user exists
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create in Supabase
      const supabaseAdmin = this.supabaseService.getAdminClient();
      const { data: authUser, error } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: email_verified,
          user_metadata: { name, provider: 'google' },
        });

      if (error) {
        throw new BadRequestException(error.message);
      }

      // Create in Prisma
      user = await this.prisma.user.create({
        data: {
          id: authUser.user.id,
          email,
          name: name || 'Google User',
          emailVerified: email_verified || false,
          referralCode: generateRandomCode(),
        },
      });

      if (user.referredByUserId) {
        await this.prisma.referral.create({
          data: {
            referrerUserId: user.referredByUserId,
            referredUserId: user.id,
          },
        });
      }
    }

    // Generate session
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    return {
      user: this.formatUser(user),
      session: { access_token: sessionData.properties?.hashed_token },
    };
  }

  async validateToken(token: string) {
    const supabase = this.supabaseService.getClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async getReferrerUserId(
    referralCode: string,
  ): Promise<string | null> {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    return referrer?.id || null;
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode,
    };
  }
}
