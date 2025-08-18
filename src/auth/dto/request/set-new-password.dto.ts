import { IsString, MinLength } from "class-validator";

export class SetNewPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string;
}
