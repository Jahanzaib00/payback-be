import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ClaimReferralDto {
  @ApiProperty({ description: "Referral code to claim" })
  @IsString()
  @IsNotEmpty()
  referralCode: string;
}