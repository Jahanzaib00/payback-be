import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  SignUpDto,
  SignInDto,
  GoogleAuthDto,
  VerifyOtpDto,
  ResendOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  VerifyForgotPasswordOtpDto,
  SetNewPasswordDto,
} from "./dto/request";
import {
  SignUpApiResponseDto,
  SignInApiResponseDto,
  GoogleAuthApiResponseDto,
  VerifyOtpApiResponseDto,
  RefreshTokenApiResponseDto,
  ResendOtpApiResponseDto,
  ForgotPasswordApiResponseDto,
  VerifyForgotPasswordOtpApiResponseDto,
  SetNewPasswordApiResponseDto,
} from "./dto/api-response";
import { ResponseUtil } from "../util/response.util";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { GetUserId } from "../decorators/user-id.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto): Promise<SignUpApiResponseDto> {
    await this.authService.signUp(signUpDto);
    return ResponseUtil.success(
      undefined,
      "Please check your email to verify your account.",
      HttpStatus.CREATED
    );
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto): Promise<SignInApiResponseDto> {
    const result = await this.authService.signIn(signInDto);
    return ResponseUtil.success(result, "Sign in successful", HttpStatus.OK);
  }

  @Post("google")
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto
  ): Promise<GoogleAuthApiResponseDto> {
    const result = await this.authService.googleAuth(googleAuthDto);
    return ResponseUtil.success(
      result,
      "Google authentication successful",
      HttpStatus.OK
    );
  }

  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto
  ): Promise<VerifyOtpApiResponseDto> {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    return ResponseUtil.success(
      result,
      "Email verified successfully",
      HttpStatus.OK
    );
  }

  @Post("resend-otp")
  @HttpCode(HttpStatus.OK)
  async resendOtp(
    @Body() resendOtpDto: ResendOtpDto
  ): Promise<ResendOtpApiResponseDto> {
    await this.authService.resendOtp(resendOtpDto);
    return ResponseUtil.success(
      undefined,
      "Verification email sent successfully",
      HttpStatus.OK
    );
  }

  @Post("refresh-token")
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<RefreshTokenApiResponseDto> {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return ResponseUtil.success(
      result,
      "Token refreshed successfully",
      HttpStatus.OK
    );
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ): Promise<ForgotPasswordApiResponseDto> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseUtil.success(
      undefined,
      "Password reset OTP sent",
      HttpStatus.OK
    );
  }

  @Post("verify-forgot-password-otp")
  @HttpCode(HttpStatus.OK)
  async verifyForgotPasswordOtp(
    @Body() verifyForgotPasswordOtpDto: VerifyForgotPasswordOtpDto
  ): Promise<VerifyForgotPasswordOtpApiResponseDto> {
    const result = await this.authService.verifyForgotPasswordOtp(
      verifyForgotPasswordOtpDto
    );
    return ResponseUtil.success(
      result,
      "OTP verified successfully",
      HttpStatus.OK
    );
  }

  @Post("set-new-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async setNewPassword(
    @GetUserId() userId: string,
    @Body() setNewPasswordDto: SetNewPasswordDto
  ): Promise<SetNewPasswordApiResponseDto> {
    await this.authService.setNewPassword(userId, setNewPasswordDto);
    return ResponseUtil.success(
      undefined,
      "Password updated successfully",
      HttpStatus.OK
    );
  }
}
