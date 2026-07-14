const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

export function getCurrentUsername(): string {
  return process.env.ADMIN_USERNAME || DEFAULT_USERNAME;
}

export function getCurrentPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function getExpectedToken(): string {
  return Buffer.from(`${getCurrentUsername()}:${getCurrentPassword()}`).toString("base64");
}

export function isValidToken(token: string): boolean {
  if (!token) return false;

  const expected = getExpectedToken();
  if (token === expected) return true;

  const hasCustomUsername = process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME !== DEFAULT_USERNAME;
  if (!hasCustomUsername) {
    const legacyExpected = Buffer.from(getCurrentPassword()).toString("base64");
    if (token === legacyExpected) return true;
  }

  return false;
}
