export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name];
}

export function getSqlitePath(): string {
  return getOptionalEnv("SQLITE_PATH") ?? "./data/funnel.sqlite";
}

export function getAppUrl(): string {
  return getOptionalEnv("APP_URL") ?? "http://localhost:3000";
}

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === "test" || process.env.BUN_TEST === "1";
}
