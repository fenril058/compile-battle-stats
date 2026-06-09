export function resolveSeasonKey<T extends string>(
  stored: string | null,
  validKeys: readonly T[],
): T {
  if (stored !== null && (validKeys as readonly string[]).includes(stored)) {
    return stored as T;
  }
  return validKeys[0];
}
