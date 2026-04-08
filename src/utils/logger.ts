/** Simple structured logger. Replace with pino/winston in production. */
export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", msg, ...meta, ts: new Date().toISOString() })),

  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", msg, ...meta, ts: new Date().toISOString() })),

  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", msg, ...meta, ts: new Date().toISOString() })),

  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env["NODE_ENV"] !== "production") {
      console.debug(JSON.stringify({ level: "debug", msg, ...meta, ts: new Date().toISOString() }));
    }
  },
};
