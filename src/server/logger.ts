type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const isSilenced = () => process.env.NODE_ENV === "test";

const write = (level: LogLevel, event: string, meta: LogMeta = {}) => {
  if (isSilenced()) return;

  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...meta,
  });

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
};

export const logger = {
  info: (event: string, meta?: LogMeta) => write("info", event, meta),
  warn: (event: string, meta?: LogMeta) => write("warn", event, meta),
  error: (event: string, meta?: LogMeta) => write("error", event, meta),
};
