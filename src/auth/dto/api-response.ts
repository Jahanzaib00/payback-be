import { ApiProperty } from "@nestjs/swagger";
import {
  SignInResponseDto,
  GoogleAuthResponseDto,
  VerifyOtpResponseDto,
  RefreshTokenResponseDto,
  VerifyForgotPasswordOtpResponseDto,
} from "./response";

export class SignUpApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;
}

export class SignInApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: SignInResponseDto })
  data?: SignInResponseDto;
}

export class GoogleAuthApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: GoogleAuthResponseDto })
  data?: GoogleAuthResponseDto;
}

export class VerifyOtpApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: VerifyOtpResponseDto })
  data?: VerifyOtpResponseDto;
}

export class RefreshTokenApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: RefreshTokenResponseDto })
  data?: RefreshTokenResponseDto;
}

class ResendOtpData {
  @ApiProperty()
  message: string;
}

export class ResendOtpApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: ResendOtpData })
  data?: ResendOtpData;
}

export class ForgotPasswordApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;
}

export class VerifyForgotPasswordOtpApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: VerifyForgotPasswordOtpResponseDto })
  data?: VerifyForgotPasswordOtpResponseDto;
}

export class SetNewPasswordApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;
}
