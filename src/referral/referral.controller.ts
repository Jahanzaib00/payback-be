import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ReferralService } from "./referral.service";
import { ClaimReferralDto } from "./dto/request";
import { JwtAuthGuard } from "../guards";
import { GetUserId } from "../decorators";

@Controller("referral")
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Post("claim")
  @UseGuards(JwtAuthGuard)
  async claimReferral(
    @GetUserId() userId: string,
    @Body() claimReferralDto: ClaimReferralDto
  ) {
    return this.referralService.claimReferral(userId, claimReferralDto);
  }
}
