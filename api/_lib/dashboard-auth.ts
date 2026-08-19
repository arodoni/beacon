/** Checks the `Authorization: Bearer <secret>` header used to guard dashboard write endpoints. */
export function isAuthorized(authHeader: string | undefined, secret: string): boolean {
  return authHeader === `Bearer ${secret}`;
}
