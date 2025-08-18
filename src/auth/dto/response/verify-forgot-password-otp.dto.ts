import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";
import { SessionResponseDto } from "./session.dto";

@Exclude()
export class VerifyForgotPasswordOtpResponseDto {
  @Expose()
  session: SessionResponseDto;
}
