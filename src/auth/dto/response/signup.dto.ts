import { Exclude, Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { UserResponseDto } from "./user.dto";

@Exclude()
export class SignUpResponseDto {
  @Expose()
  @IsOptional()
  user?: UserResponseDto;

  @Expose()
  @IsString()
  message: string;
}
