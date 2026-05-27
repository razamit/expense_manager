// Maps raw scraper error types (israeli-bank-scrapers ScraperErrorTypes plus
// our internal types) to clear, user-facing explanations. The library often
// returns an empty errorMessage (e.g. CHANGE_PASSWORD), so the type alone must
// produce something actionable.

const FRIENDLY_BY_TYPE: Record<string, string> = {
  CHANGE_PASSWORD:
    "The provider requires a password change. Log in to their website, set a new password, update the saved credentials here, then sync again.",
  INVALID_PASSWORD:
    "Invalid username or password. Update the saved credentials and try again.",
  ACCOUNT_BLOCKED:
    "The account is blocked by the provider. Contact them to unlock it, then sync again.",
  TIMEOUT:
    "The provider's site timed out before the scrape finished. Try again in a few minutes.",
  TWO_FACTOR_RETRIEVER_MISSING:
    "This account requires two-factor authentication, which isn't configured for it.",
  MISSING_ACCOUNT_NUMBER:
    "The scrape returned accounts without identifiable card/account numbers, so none could be bound.",
  BINDING_REQUIRED:
    "Select the matching card before importing transactions.",
  GENERIC: "The scrape failed unexpectedly. Open the run log for details.",
  GENERAL_ERROR: "The scrape failed unexpectedly. Open the run log for details.",
};

/** Returns true when the failure needs the user to reset their password. */
export function isPasswordChangeError(errorType?: string | null): boolean {
  return errorType === "CHANGE_PASSWORD";
}

/**
 * Produces a user-facing message for a failed scrape. Prefers a friendly
 * explanation for known error types and appends the raw message when present.
 */
export function describeScrapeError(
  errorType?: string | null,
  errorMessage?: string | null
): string {
  const rawMessage = errorMessage?.trim();
  const friendly = errorType ? FRIENDLY_BY_TYPE[errorType] : undefined;

  if (friendly) {
    return rawMessage ? `${friendly} (${rawMessage})` : friendly;
  }
  return rawMessage || "The scrape failed. Open the run log for details.";
}
