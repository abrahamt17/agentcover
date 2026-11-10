import { createHash, randomBytes } from "node:crypto";

/** 256 bits of entropy, URL-safe. Shown to the inviter once and never stored. */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex digest. Must match `encode(sha256(convert_to(token, 'UTF8')), 'hex')` in SQL. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
