import { Exclude, Expose } from "class-transformer";
import { SessionResponseDto } from "./session.dto";

@Exclude()
export class RefreshTokenResponseDto {
  @Expose()
  session: SessionResponseDto;

  @Expose()
  message: string;
}
