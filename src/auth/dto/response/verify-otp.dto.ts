import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";
import { UserResponseDto } from "./user.dto";
import { SessionResponseDto } from "./session.dto";

@Exclude()
export class VerifyOtpResponseDto {
  @Expose()
  user: UserResponseDto;

  @Expose()
  session: SessionResponseDto;
}
