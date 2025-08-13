import { Exclude, Expose } from "class-transformer";
import { IsOptional } from "class-validator";
import { UserResponseDto } from "./user.dto";
import { SessionResponseDto } from "./session.dto";

@Exclude()
export class GoogleAuthResponseDto {
  @Expose()
  user: UserResponseDto;

  @Expose()
  @IsOptional()
  session?: SessionResponseDto;
}
