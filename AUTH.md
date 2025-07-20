# Migrating Authentication to Cloudflare Zero Trust

This guide provides a concrete, step-by-step process for migrating this project's current custom authentication system to Cloudflare Zero Trust. This migration will enhance security by centralizing user management and leveraging Cloudflare's robust security features.

## 1. Analysis of the Current System

Our current authentication is a custom-built JWT-based system with the following components:

- **Token Generation:** A CLI tool (`bin/jwt.ts`) generates HS256-signed JWTs.
- **Token-based Permissions:** The token's `sub` (subject) claim dictates its permissions (e.g., `api:metrics`, `admin`).
- **Metadata Storage:** Token metadata (UUID, subject, etc.) is stored in a Cloudflare D1 database (`jwt_tokens` table).
- **Revocation:** Revocation is handled by placing the token's `jti` (UUID) into a Cloudflare KV namespace (`auth:revocation:`).
- **Validation:** An H3 middleware (`server/utils/auth.ts`) validates the JWT signature, checks for expiration, and verifies against the KV revocation list.
- **Authorization:** The `checkEndpointPermission` function in `server/utils/auth.ts` authorizes requests based on the token's `sub` claim against the required permission for an endpoint.

This system is effective but requires manual token management and custom code for storage and revocation.

## 2. The Migration Plan: From Custom JWT to Cloudflare Access

The goal is to replace the custom JWT implementation with Cloudflare Access, which will handle user authentication and issue its own JWTs to our origin.

### Step 1: Set Up Cloudflare Zero Trust

1.  **Choose an Identity Provider (IdP):**
    - In the Zero Trust dashboard (**Settings > Authentication**), configure one or more IdPs. For this project, good options include:
      - **GitHub:** To allow login with your GitHub account.
      - **Google:** To allow login with a Google account.
      - **One-Time PIN (OTP):** To allow any user to log in with a code sent to their email. This is the closest analog to the current "anyone with a token" system.

2.  **Create an Access Application:**
    - In the Zero Trust dashboard (**Access > Applications**), create a new **Self-hosted** application.
    - **Application Domain:** Configure it to protect the entire application at `dave.io` and any subdomains you wish to secure.

3.  **Create an Initial Access Policy:**
    - Create a simple policy to grant access. For example:
      - **Action:** `Allow`
      - **Rule:** `Emails` -> `ending in` -> `@dave.io` (or your personal email).
    - This ensures that only you (or designated users) can pass through Cloudflare's authentication layer to reach the application.

### Step 2: Modify the Application Code

This is the most critical part of the migration. We need to adapt our code to validate Cloudflare's JWT instead of our own.

1.  **Update Token Extraction:**
    - The token will no longer be in the `Authorization` header or `?token=` query. Cloudflare sends its JWT in the `Cf-Access-Jwt-Assertion` header.
    - The `extractToken` function in `server/utils/auth.ts` must be updated to read from this header.

2.  **Rewrite JWT Validation (`verifyJWT`):**
    - The `verifyJWT` function in `server/utils/auth.ts` must be completely replaced.
    - It no longer needs the `API_JWT_SECRET`. Instead, it must:
      - Fetch Cloudflare's public keys from your organization's certs endpoint: `https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/certs`.
      - Use a JWT library (like `jose`, which is already a dependency) to decode and verify the incoming JWT from the `Cf-Access-Jwt-Assertion` header against those public keys. Cloudflare uses an `RS256` signature.
      - Validate the `iss` (issuer) and `aud` (audience) claims in the token to ensure it was issued by your Cloudflare organization for this specific application.

3.  **Adapt Authorization Logic (`checkEndpointPermission`):**
    - The Cloudflare JWT contains user identity (e.g., `email`), not our custom permission strings in the `sub` claim. We must adapt our authorization logic.
    - **Option A (Recommended): Use Access Groups.**
      1.  In Cloudflare Zero Trust, create **Access Groups** (e.g., `admins`, `api-users`).
      2.  Assign users to these groups.
      3.  Configure your Access Application to pass group information within the JWT as a custom claim (e.g., a `groups` array).
      4.  Modify `checkEndpointPermission` in `server/utils/auth.ts` to inspect `payload.groups` instead of `payload.sub` to make authorization decisions. This provides a direct replacement for the current permission model.
    - **Option B (Simpler): Email-based Roles.**
      - Modify `checkEndpointPermission` to use the `email` claim from the JWT. You can hardcode roles (e.g., if `email === 'dave@example.com'`, grant `admin` access) or look up permissions from a database. This is less flexible but easier to implement initially.

### Step 3: Handling Programmatic Access with Service Tokens

For programmatic access (e.g., CLIs, scripts, other services) where a user cannot log in via an IdP, we will use Cloudflare's **Service Tokens**. While these tokens consist of a Client ID and Client Secret, we can configure our Access Application to accept them in a standard `Authorization` header for cleaner, more conventional API calls.

1.  **Create a Service Token:**
    - In the Zero Trust dashboard, navigate to **Access > Service Auth > Service Tokens**.
    - Create a new token. You will receive a `Client ID` and a `Client Secret`. **Store both securely, as the secret will not be shown again.**

2.  **Configure the Access Application for Bearer Tokens:**
    - This is a **one-time setup** via the Cloudflare API to tell your Access Application to look for the service token in the `Authorization` header.
    - First, get your application's current configuration:
      ```bash
      curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/apps/{app_id}" \
           -H "Authorization: Bearer <YOUR_CLOUDFLARE_API_TOKEN>" \
           -H "Content-Type: application/json"
      ```
    - Then, send a `PUT` request, adding the `"read_service_tokens_from_header": "Authorization"` field to the existing configuration:
      ```bash
      curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/apps/{app_id}" \
           -H "Authorization: Bearer <YOUR_CLOUDFLARE_API_TOKEN>" \
           -H "Content-Type: application/json" \
           --data '{
             // ...all your existing app config...
             "read_service_tokens_from_header": "Authorization"
           }'
      ```

3.  **Update the Access Policy:**
    - Modify your Access Application's policy (or create a new one with higher precedence) to allow access for your service token.
    - **Action:** `Service Auth`
    - **Rule:** `Include` -> `Service Token` -> `is` -> (Select the service token you just created).

4.  **How Clients Authenticate:**
    - Programmatic clients can now authenticate using the standard `Authorization` header. The `Bearer` scheme must be used.
    - The token itself is constructed by concatenating the Client ID and Client Secret with a colon (`:`), and then Base64 encoding the resulting string.
    - **Token Value:** `base64(<Client-ID>:<Client-Secret>)`
    - **Header:** `Authorization: Bearer <token-value>`

5.  **Adapt Application Code for Service Tokens:**
    - When a client authenticates this way, Cloudflare verifies the token and forwards the request. It **does not** send a JWT.
    - Instead, it adds identifying headers like `Cf-Access-Client-Id`.
    - The `authorizeEndpoint` function in `server/utils/auth.ts` must be updated to handle this flow:
      - First, check for the `Cf-Access-Jwt-Assertion` header (for logged-in users).
      - If it's not present, check for the `CF-Access-Client-Id` header.
      - If the `CF-Access-Client-Id` header exists, the request is authenticated as a service. The Client ID can be used to identify the service and grant appropriate permissions.

### Step 4: Deprecate Old Infrastructure

Once the application is successfully using Cloudflare Access JWTs (for users) and Service Tokens (for services), the old infrastructure is no longer needed.

1.  **Decommission `bin/jwt.ts`:** The CLI tool for creating tokens is now fully replaced by Cloudflare's user login and Service Token generation. It can be deleted.
2.  **Remove D1 Token Store:** The `jwt_tokens` table in D1 is no longer necessary. It can be backed up and deleted.
3.  **Remove KV Revocation:** The `auth:revocation:*` keys and the logic that checks them are obsolete. Session and token management is handled by Cloudflare.
4.  **Clean Up Config:** The `API_JWT_SECRET` environment variable can be removed from all configurations.

## 4. Conclusion

Migrating to Cloudflare Zero Trust will replace our bespoke authentication code with a managed, more secure, and more feature-rich solution that handles both user-interactive logins and programmatic service access. The core of the work involves adapting our server-side validation and authorization logic to consume either a Cloudflare-issued JWT or Service Token headers. By following this plan, we can achieve a seamless and secure migration.

For more detailed information, refer to the official Cloudflare documentation on [JWTs](https://developers.cloudflare.com/cloudflare-one/identity/users/jwt-tokens/) and [Service Tokens](https://developers.cloudflare.com/cloudflare-one/identity/service-auth/service-tokens/).
