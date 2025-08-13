import { ApiProperty } from "@nestjs/swagger";

class ClaimReferralData {
  @ApiProperty()
  message: string;
}

export class ClaimReferralApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: ClaimReferralData })
  data?: ClaimReferralData;
}