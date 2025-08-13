import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ReferralService } from "./referral.service";
import { ClaimReferralDto } from "./dto/request";
import { JwtAuthGuard } from "../guards";
import { GetUserId } from "../decorators";
import { ResponseUtil } from "../util/response.util";
import { ClaimReferralApiResponseDto } from "./dto/api-response";

@ApiTags("Referrals")
@ApiBearerAuth()
@Controller("referral")
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Post("claim")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async claimReferral(
    @GetUserId() userId: string,
    @Body() claimReferralDto: ClaimReferralDto,
  ): Promise<ClaimReferralApiResponseDto> {
    const result = await this.referralService.claimReferral(
      userId,
      claimReferralDto,
    );
    return ResponseUtil.success(
      result,
      "Referral claimed successfully",
      HttpStatus.OK,
    );
  }
}
