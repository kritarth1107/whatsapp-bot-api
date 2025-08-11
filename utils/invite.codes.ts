import crypto from "crypto";
import appConfig from "../config/app.config";
const SECRET = appConfig.encryption.inviteSecret;
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


  
// Generate 5-character random code
function generateRandomCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[crypto.randomInt(0, CHARSET.length)];
  }
  return code;
}

// Create signature: HMAC of code → Base36 → Take 3 chars
function createSignature(code: string): string {
    const hmac = crypto.createHmac("sha256", SECRET as string).update(code).digest();
    const num = hmac.readUIntBE(0, 4); // Read 4 bytes = 32 bits
    return num.toString(36).toUpperCase().slice(0, 3); // Base36, 3 chars
}

// Create final 8-character invite code
export function generateInviteCode(): string {
    const code = generateRandomCode(5);
    const sig = createSignature(code);
    return code + sig; // 5-char code + 3-char signature = 8 total
}

// Verify invite code
export function verifyInviteCode(inviteCode: string): boolean {
    if (inviteCode.length !== 8) return false;
    const code = inviteCode.slice(0, 5);
    const sig = inviteCode.slice(5);
    return createSignature(code) === sig;
}

// ✅ Bulk generator
export function generateMultipleInviteCodes(count: number): { code: string }[] {
    if (count < 1 || count > 20) throw new Error("Count must be between 1 and 20");
  
    const codes = new Set<string>();
    while (codes.size < count) {
      codes.add(generateInviteCode());
    }
  
    return Array.from(codes).map(code => ({ code }));
  }