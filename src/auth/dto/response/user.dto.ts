import { Exclude, Expose } from "class-transformer";
import { IsBoolean, IsString } from "class-validator";

@Exclude()
export class UserResponseDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsString()
  email: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsBoolean()
  emailVerified: boolean;

  @Expose()
  @IsString()
  referralCode: string;

  @Expose()
  @IsString()
  pfCoinBalance: string;

  @Expose()
  @IsString()
  subscriptionStatus: string;
}
