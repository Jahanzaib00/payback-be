import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";

@Exclude()
export class SessionResponseDto {
  @Expose()
  @IsString()
  access_token: string;

  @Expose()
  @IsString()
  refresh_token: string;
}
