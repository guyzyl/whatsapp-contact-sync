import fs from "fs";
import path from "path";
import { Auth } from "googleapis";

/**
 * Stores the Google OAuth credentials on disk.
 *
 * Without this the refresh token only lived in the session cache, so every
 * backend restart (and every crash) forced a full Google sign-in again. The
 * WhatsApp session is already persisted; this makes Google behave the same way.
 *
 * The file is a secret: it can read and rewrite every contact of the account.
 * It lives in `server/data/` (git-ignored) and is written with owner-only
 * permissions where the platform supports it.
 */
export interface GoogleTokenStore {
  load(): Auth.Credentials | null;
  save(tokens: Auth.Credentials): void;
  clear(): void;
  /** Where the token is stored, for logs (`:memory:` in tests). */
  filePath(): string;
}

/** Keep only real credential fields; the token response carries extras. */
function pickCredentials(tokens: Auth.Credentials): Auth.Credentials {
  const picked: Auth.Credentials = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    scope: tokens.scope,
    token_type: tokens.token_type,
    id_token: tokens.id_token,
  };

  // Undefined values would serialise as `null` and confuse google-auth-library
  // into thinking a refresh token exists when it does not.
  return Object.fromEntries(
    Object.entries(picked).filter(([, value]) => value !== undefined)
  ) as Auth.Credentials;
}

function createMemoryStore(): GoogleTokenStore {
  let tokens: Auth.Credentials | null = null;

  return {
    load: () => tokens,
    save: (next) => {
      tokens = pickCredentials(next);
    },
    clear: () => {
      tokens = null;
    },
    filePath: () => ":memory:",
  };
}

function createFileStore(filePath: string): GoogleTokenStore {
  return {
    load() {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (!parsed || typeof parsed !== "object") return null;
        return parsed as Auth.Credentials;
      } catch (e) {
        const code = (e as NodeJS.ErrnoException)?.code;
        if (code !== "ENOENT") {
          // A half-written or hand-edited file must not crash the server:
          // deleting it just means one extra Google sign-in.
          console.error(
            `Could not read the saved Google token at ${filePath}:`,
            e instanceof Error ? e.message : e
          );
        }
        return null;
      }
    },

    save(tokens) {
      try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(pickCredentials(tokens), null, 2), {
          mode: 0o600,
        });
      } catch (e) {
        // Losing persistence only costs a re-login later.
        console.error(
          `Could not save the Google token to ${filePath}:`,
          e instanceof Error ? e.message : e
        );
      }
    },

    clear() {
      try {
        fs.rmSync(filePath, { force: true });
      } catch {
        // Already gone or not removable; either way there is nothing to serve.
      }
    },

    filePath: () => filePath,
  };
}

let store: GoogleTokenStore | null = null;

/** Builds a store for an explicit path (`null` or `:memory:` keeps it in RAM). */
export function createTokenStore(filePath: string | null): GoogleTokenStore {
  return filePath && filePath !== ":memory:"
    ? createFileStore(filePath)
    : createMemoryStore();
}

/**
 * Process-wide store, backed by `server/data/google-token.json` unless
 * `GOOGLE_TOKEN_PATH` points somewhere else (`:memory:` keeps it in RAM).
 */
export function getTokenStore(): GoogleTokenStore {
  if (!store) {
    store = createTokenStore(
      process.env.GOOGLE_TOKEN_PATH ||
        path.resolve("data", "google-token.json")
    );
  }
  return store;
}

/** Test hook: forget the process-wide instance. */
export function resetTokenStoreForTests(): void {
  store = null;
}
