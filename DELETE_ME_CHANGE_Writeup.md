# Fix: Google OAuth flow broken (Issue #267 / #264)

## Problem

Google Sign-In stopped working. After clicking "Sign in with Google" and approving
permissions in the popup, the app stayed on Step 2 (Authorize Google) and never
advanced to Step 3 (Options/Sync). No error appeared in the browser console.

**Root cause:** The previous implementation used the Google Identity Services (GIS)
implicit/token flow (`google.accounts.oauth2.initTokenClient`). This flow opens a
popup and relies on cross-origin `postMessage` (via Google's `storagerelay` /
`postmessagehandler` pages) to pass the access token back to the opener window.

Recent browser Cross-Origin-Opener-Policy (COOP) enforcement — triggered by
Google's own OAuth pages setting `Cross-Origin-Opener-Policy: same-origin-allow-popups`
— severs `window.opener` access. The popup closes successfully after user approval,
the permission shows up in the user's Google account, but the JavaScript callback is
**never invoked**. The failure is completely silent.

This is the same underlying issue reported in #264, which was only partially addressed
by PR #265 (that PR removed the old `gapi.js` library but kept the broken GIS token
client).

---

## Solution

Replace the client-side popup flow entirely with a **server-side OAuth 2.0
Authorization Code** flow. The browser performs a standard full-page redirect to
Google and back — no popup, no cross-origin JavaScript communication.

### Flow overview

```
User clicks button
       │
       ▼
GET /api/google_auth_start          (server generates auth URL + CSRF state)
       │
       ▼  (browser redirected to Google)
Google OAuth consent screen
       │
       ▼  (Google redirects back)
GET /api/google_callback?code=…&state=…
       │  (server validates state, exchanges code for tokens, stores in session)
       ▼
Browser redirected to /options      ✅ Step 3
```

---

## Files Changed

### `server/src/gapi.ts`

- **Removed** `googleLogin(token)` — accepted a raw access token from the client,
  which is no longer used.
- **Added** `generateGoogleAuthUrl(redirectUri, state)` — builds the Google OAuth
  consent URL using the server's client credentials.
- **Added** `getOAuth2ClientFromCode(code, redirectUri)` — exchanges the
  authorization code (received from Google's callback) for tokens and returns a
  configured `OAuth2Client`.

### `server/routes/api.ts`

- **Removed** `POST /init_gapi` — the route that received a raw token posted from
  the browser. This is no longer needed.
- **Added** `GET /google_auth_start` — generates a cryptographically random CSRF
  `state` value, stores it in the session, then redirects the browser to Google's
  OAuth consent URL.
- **Added** `GET /google_callback` — the redirect URI Google calls after consent.
  Validates the `state` parameter against the session value (CSRF protection),
  exchanges the `code` for tokens via `getOAuth2ClientFromCode`, stores the resulting
  `OAuth2Client` in the session, then redirects to `/options`.

### `web/src/pages/GoogleAuth.vue`

- **Removed** all GIS library loading (`addJSSrc`, `onGisLoaded`, `onSignIn`),
  the `tokenClient`, hardcoded `CLIENT_ID` / `API_KEY`, and `vue-gtag` import.
- **Simplified** the button `@click` handler to `window.location.href = "/api/google_auth_start"`.
- The button is always enabled (no longer waits for an async script to load).

### `assets/nginx.conf`

- Changed `proxy_set_header Host $host` → `proxy_set_header Host $http_host`.
- `$host` strips the port, causing the server to build a redirect URI like
  `http://localhost/api/google_callback` (port missing). `$http_host` preserves the
  original `Host` header including port (e.g. `localhost:8080`), which must exactly
  match a URI registered in Google Cloud Console.

---

## Required Google Cloud Console Changes

The authorization code flow requires the callback URL to be explicitly whitelisted
as an **Authorized Redirect URI** on the OAuth 2.0 client credential used by this app.

See the Google Cloud Console section below for step-by-step instructions.

---

## Security Notes

- CSRF protection is implemented via a random `state` parameter tied to the server
  session. The callback rejects any request where `state` does not match.
- The authorization code exchange happens entirely server-side. No tokens are ever
  sent to or from the browser.
- The old `CLIENT_ID` and `API_KEY` that were hardcoded in the Vue component have
  been removed from the client. All credentials now live only in server environment
  variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
