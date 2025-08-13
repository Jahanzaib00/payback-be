import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseService } from "../supabase/supabase.service";
import {
  SignUpDto,
  SignInDto,
  GoogleAuthDto,
  VerifyOtpDto,
  ResendOtpDto,
  RefreshTokenDto,
} from "./dto/request";
import {
  SignUpResponseDto,
  SignInResponseDto,
  GoogleAuthResponseDto,
  VerifyOtpResponseDto,
  RefreshTokenResponseDto,
  UserResponseDto,
} from "./dto/response";
import { generateRandomCode } from "../util/random.util";
import { normalizeEmail } from "../util/email.util";
import { User } from "@prisma/client";

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async signUp(signUpDto: SignUpDto): Promise<SignUpResponseDto> {
    const { email, password, name } = signUpDto;
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException("User already exists with this email");
    }

    const { user: supabaseUser } = await this.supabaseService.signUp(
      normalizedEmail,
      password,
      { name }
    );

    if (!supabaseUser) {
      throw new BadRequestException("Failed to create user");
    }

    try {
      // Create user in Prisma
      const user = await this.prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: normalizedEmail,
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

      return {
        user: this.formatUser(user),
      };
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to create account");
    }
  }

  async signIn(signInDto: SignInDto): Promise<SignInResponseDto> {
    const { email, password } = signInDto;
    const normalizedEmail = normalizeEmail(email);

    const { user: supabaseUser, session } = await this.supabaseService.signIn(
      normalizedEmail,
      password
    );

    if (!supabaseUser || !session) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!user) {
      throw new UnauthorizedException("User not found in database");
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException("Your email is not verified");
    }

    return {
      user: this.formatUser(user),
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    };
  }

  async googleAuth(
    googleAuthDto: GoogleAuthDto
  ): Promise<GoogleAuthResponseDto> {
    const { idToken } = googleAuthDto;

    const payload = await this.verifyGoogleToken(idToken);
    const { email, name, email_verified } = payload;
    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Create user in Supabase
      const supabaseUser = await this.supabaseService.createUserWithAdmin(
        normalizedEmail,
        undefined, // No password for Google users
        { name, provider: "google" }
      );

      // Create user in database
      user = await this.prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: normalizedEmail,
          name,
          emailVerified: email_verified,
          referralCode: generateRandomCode(),
        },
      });
    }

    const accessToken = await this.supabaseService.generateMagicLink(normalizedEmail);

    return {
      user: this.formatUser(user),
      session: accessToken
        ? {
            access_token: accessToken,
            refresh_token: "",
          }
        : undefined,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    const { email, token } = verifyOtpDto;
    const normalizedEmail = normalizeEmail(email);

    const { user: supabaseUser, session } =
      await this.supabaseService.verifyOtp(normalizedEmail, token, "email");

    // Check if user already exists in database
    let user = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!user) {
      throw new UnauthorizedException("User not found in database");
    }
    if (user.emailVerified) {
      throw new ConflictException("Email already verified");
    }

    user = await this.prisma.user.update({
      where: { id: supabaseUser.id },
      data: { emailVerified: true },
    });

    return {
      user: this.formatUser(user),
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    const normalizedEmail = normalizeEmail(email);

    const { error } = await this.supabaseService.sendVerificationEmail(normalizedEmail);
    if (error) {
      throw new Error(error.message || "Failed to resend OTP");
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto
  ): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    const { session, user: supabaseUser } =
      await this.supabaseService.refreshToken(refreshToken);

    if (!session || !supabaseUser) {
      throw new UnauthorizedException("Failed to refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!user) {
      throw new UnauthorizedException("User not found in database");
    }

    return {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    };
  }

  async validateToken(token: string) {
    const supabaseUser = await this.supabaseService.getUserFromToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  //private functions
  private async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException("Invalid Google token");
      }

      const { email, name, email_verified, picture, sub } = payload;

      if (!email || !email_verified) {
        throw new UnauthorizedException(
          "Email is required and must be verified"
        );
      }

      return {
        email,
        name: name || "Google User",
        email_verified,
        picture,
        sub,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid Google token");
    }
  }

  private formatUser(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode,
      pfCoinBalance: user.pfCoinBalance.toString(),
      subscriptionStatus: user.subscriptionStatus,
    };
  }
}
