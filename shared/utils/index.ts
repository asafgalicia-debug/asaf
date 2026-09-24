export function normalizeEnumValue(value: string): string {
  return value.trim().toUpperCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
