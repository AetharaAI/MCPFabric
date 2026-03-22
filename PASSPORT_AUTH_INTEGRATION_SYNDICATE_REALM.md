• Passport Auth Handoff Pattern For Another App In The Same Realm

  1. Root cause of the Syndicate auth failure

  There were two real app-side failures:

  - OAuth state validation was broken because the callback handler was trying to read cookies from req.cookies, but this app was not using cookie-parser or express-session. The state
    cookie existed, but the callback could not read it, so auth failed with Invalid OAuth state.
  - JWT_SECRET was blank in the app .env, so even after Passport auth succeeded, the app could not reliably complete its own signed session flow.

  There was also a config mismatch earlier:

  - the app originally expected different Passport env names than the repo actually used
  - the redirect domain had been wrong (syndicate.co vs syndicateai.co) until corrected

  2. Exact fix that resolved it

  The working fix was:

  - keep OAuth state and PKCE in secure httpOnly cookies
  - parse cookies directly from req.headers.cookie in the callback handler
  - keep the token exchange on the backend only
  - ensure JWT_SECRET is set before handling the callback
  - recreate the app container so the new env values are actually loaded
  - align the callback URI to the real live domain

  After that, the full live flow succeeded:

  - state validation
  - PKCE validation
  - token exchange
  - userinfo fetch
  - local user upsert
  - app session cookie write
  - redirect home

  3. Required env/config values

  Minimum required:

  - PASSPORT_CLIENT_ID
  - PASSPORT_CLIENT_SECRET
  - PASSPORT_DISCOVERY_URL
    or alternatively a usable issuer/base+realm combination
  - JWT_SECRET
  - FRONTEND_URL

  Supported Passport config in this app:

  - PASSPORT_DISCOVERY_URL
  - PASSPORT_ISSUER
  - PASSPORT_ISSUER_URL
  - PASSPORT_BASE_URL
  - PASSPORT_REALM
  - PASSPORT_CLIENT_ID
  - PASSPORT_CLIENT_SECRET
  - PASSPORT_SCOPES
  - PASSPORT_REDIRECT_URI
  - PASSPORT_POST_LOGOUT_REDIRECT_URI

  For Syndicate, the critical live values are:

  - callback: https://syndicateai.co/oauth/callback
  - post logout redirect: https://syndicateai.co/

  4. Where login starts

  Backend route:

  - server/_core/oauth.ts
      - GET /api/auth/login
      - GET /api/auth/register

  Frontend entrypoints:

  - client/src/const.ts
  - client/src/components/Navbar.tsx
  - client/src/pages/PostListing.tsx

  5. Where the Passport callback is handled

  Backend callback handler:

  - server/_core/oauth.ts

  Routes:

  - GET /oauth/callback
  - GET /api/oauth/callback

  Frontend callback page:

  - client/src/pages/OAuthCallback.tsx

  The frontend callback page just forwards the browser to the backend callback handler.

  6. Where state / PKCE / session validation happens

  State + PKCE validation:

  - server/_core/oauth.ts

  What happens there:

  - read oauth_state, oauth_verifier, and oauth_return_to from cookies
  - compare returned state with stored cookie
  - require the PKCE verifier cookie
  - reject early if either is missing/mismatched

  App session validation/read path:

  - server/_core/sdk.ts
  - session cookie helpers also depend on server/_core/cookies.ts

  7. Where token exchange happens

  Backend only:

  - server/_core/sdk.ts

  The method is:

  - exchangeAuthorizationCode(...)

  This uses:

  - Passport discovery
  - token endpoint POST
  - client_id
  - client_secret
  - code_verifier
  - redirect_uri

  The secret never goes to the frontend.

  8. Where user upsert / session write happens

  User upsert:

  - server/db.ts
  - called from server/_core/oauth.ts

  Session write:

  - server/_core/oauth.ts
  - signed JWT session generation lives in server/_core/sdk.ts

  What gets written:

  - app session cookie
  - httpOnly
  - secure
  - durable JWT signed with JWT_SECRET

  9. What the frontend does vs what the backend does

  Frontend:

  - shows Sign In / Create Account actions
  - sends browser to /api/auth/login or /api/auth/register
  - hosts /oauth/callback page that forwards to the backend callback URL
  - checks auth state for protected UX like posting

  Backend:

  - builds Passport authorization URL
  - generates state + PKCE verifier/challenge
  - stores transient OAuth cookies
  - handles callback
  - validates state and PKCE
  - exchanges code for tokens with Passport
  - fetches userinfo
  - upserts local user
  - writes signed app session cookie
  - redirects user back into the app

  10. What logs / instrumentation were added

  Detailed callback-stage logging was added in:

  - server/_core/oauth.ts
  - server/_core/sdk.ts

  It logs:

  - login start
      - generated state
      - pseudo session id
      - whether session middleware exists
      - cookie options
      - redirect URI
  - callback received
      - returned state
      - stored state
      - cookies present
      - callback URL
  - stage pass/fail
      - state_validation
      - pkce_validation
      - token_exchange
      - userinfo_fetch
      - local_user_upsert
      - session_write
      - transient_cookie_cleanup
      - final_redirect
  - token endpoint non-200 response body
  - userinfo non-200 response body
  - full caught error stack

  11. Guardrails to add for the next app

  Add these from day one:

  - Fail fast on boot if JWT_SECRET is blank
  - Fail fast on boot if Passport discovery/client config is incomplete
  - Keep token exchange backend-only
  - Never depend on req.cookies unless cookie middleware is actually installed
  - If using cookie-backed OAuth state, parse cookies explicitly or install cookie middleware intentionally
  - Set app.set("trust proxy", 1) behind nginx/proxy
  - Ensure OAuth transient cookies are:
      - httpOnly: true
      - secure: true
      - sameSite: "lax"
  - Ensure app session cookie is:
      - httpOnly: true
      - secure: true
      - sameSite appropriate for your app
  - Keep callback and logout URIs pinned to the actual live domain
  - Add a smoke test checklist after deploy:
      - /api/auth/login returns 302
      - redirect URI is correct
      - transient cookies are set with Secure
      - real callback logs all stages
      - app session cookie is written
      - protected route recognizes signed-in user

  Short pattern to reuse

  For the next app in the same Passport realm:

  1. frontend only initiates auth
  2. backend owns Passport exchange and app session creation
  3. state + PKCE live in transient secure cookies
  4. app session lives in a signed backend cookie
  5. instrument every callback stage before debugging anything else


