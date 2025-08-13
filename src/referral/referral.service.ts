import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { ClaimReferralDto } from "./dto/request";
import { ClaimReferralResponseDto } from "./dto/response";

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  async claimReferral(
    userId: string,
    claimReferralDto: ClaimReferralDto,
  ): Promise<ClaimReferralResponseDto> {
    const { referralCode } = claimReferralDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user already has a referrer
    if (user.referredByUserId) {
      throw new ConflictException("You have already claimed a referral code");
    }

    // Find the referrer by referral code
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      throw new BadRequestException("Invalid referral code");
    }

    // Check if user is trying to refer themselves
    if (referrer.id === userId) {
      throw new BadRequestException("You cannot use your own referral code");
    }

    // Check if referral relationship already exists
    const existingReferral = await this.prisma.referral.findUnique({
      where: {
        referrerUserId_referredUserId: {
          referrerUserId: referrer.id,
          referredUserId: userId,
        },
      },
    });

    if (existingReferral) {
      throw new ConflictException("Referral relationship already exists");
    }

    // Start transaction to update user and create referral
    await this.prisma.$transaction(async (tx) => {
      // Update user with referrer
      await tx.user.update({
        where: { id: userId },
        data: { referredByUserId: referrer.id },
      });

      // Create referral record
      await tx.referral.create({
        data: {
          referrerUserId: referrer.id,
          referredUserId: userId,
          rewardAmount: new Decimal(0),
        },
      });
    });

    return {
      message: "Referral code claimed successfully",
    };
  }
}