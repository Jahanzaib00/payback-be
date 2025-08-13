import { Exclude, Expose } from "class-transformer";
import { UserResponseDto } from "./user.dto";
import { SessionResponseDto } from "./session.dto";

@Exclude()
export class SignInResponseDto {
  @Expose()
  user: UserResponseDto;

  @Expose()
  session: SessionResponseDto;
}
