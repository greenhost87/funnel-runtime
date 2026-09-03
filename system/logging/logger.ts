import { getOptionalEnv, isNodeEnvironment } from "@/system/config/environment";

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

type LogFields = Record<string, string | number | boolean | null | undefined>;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveMinLevel(): LogLevel {
  const raw = getOptionalEnv("LOG_LEVEL")?.toLowerCase();
  for (const level of LOG_LEVELS) {
    if (raw === level) {
      return level;
    }
  }
  return isNodeEnvironment("production") ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  if (isNodeEnvironment("test")) {
    return false;
  }
  return LEVEL_RANK[level] >= LEVEL_RANK[resolveMinLevel()];
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: Record<string, string | number | boolean | null> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
  };
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        entry[key] = value;
      }
    }
  }

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error("%s", line);
    return;
  }
  if (level === "warn") {
    console.warn("%s", line);
    return;
  }
  console.info("%s", line);
}

export const logger = {
  debug(message: string, fields?: LogFields): void {
    write("debug", message, fields);
  },
  info(message: string, fields?: LogFields): void {
    write("info", message, fields);
  },
  warn(message: string, fields?: LogFields): void {
    write("warn", message, fields);
  },
  error(message: string, fields?: LogFields): void {
    write("error", message, fields);
  },
};
