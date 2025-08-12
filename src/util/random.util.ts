import { randomBytes } from "crypto";

export const generateRandomCode = (length: number = 8): string => {
  const bytes = randomBytes(Math.ceil((length * 3) / 4));

  let randomCode = bytes.toString("base64");
  randomCode = randomCode.replace(/[+/=]/g, "");

  return randomCode.slice(0, length);
};
