import winston from "winston";

// Shared application logger. Diagnostic sync tracing (contact counts, per-run
// tallies and timing) is emitted with `logger.debug`, so it stays hidden at the
// default `info` level and production logs stay quiet — no bespoke feature flag.
// Lower the level (e.g. `LOG_LEVEL=debug`) to surface it when investigating a
// sync.
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
