import crypto from "node:crypto";

export function generateOtp(): string {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function verifyOtp(otp: string, hash: string): boolean {
  return hashOtp(otp) === hash;
}
