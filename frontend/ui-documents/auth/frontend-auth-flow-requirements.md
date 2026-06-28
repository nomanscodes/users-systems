# Frontend Authentication & Onboarding Flow Requirements

This document outlines the strict requirements and flow logic for handling user authentication, tenant registration, and JWT session management in the Frontend application, based on the backend implementations in `rback-users/src/modules/auth` and `rback-users/src/modules/tenants`.

---

## 1. Endpoints & Payload Mapping

### A. Tenant Self-Registration (Public)
**Endpoint:** `POST /api/v1/tenants/register`
**Purpose:** Onboards a new school and creates the initial `SCHOOL_ADMIN` user in an atomic transaction.
- **Frontend Payload:**
  ```json
  {
    "schoolName": "Green Valley High",
    "email": "admin@greenvalley.edu", 
    "phone": "+8801712345679",        // Optional
    "address": "123 Lane",            // Optional
    "password": "Admin@1234!"         // Must contain Upper, Number, Special
  }
  ```
- **Backend Behavior:** Creates the Tenant (Status: `TRIAL`) and the User (Status: `ACTIVE`, Role: `SCHOOL_ADMIN`). Maps the single `email` to both the tenant contact and the user login.
- **UI Behavior:** On success (HTTP 201), show a success banner. Do **not** auto-login. The user must manually navigate to the Login page to authenticate.

### B. User Login (Public)
**Endpoint:** `POST /api/v1/auth/login`
- **Frontend Payload:**
  ```json
  {
    "email": "admin@greenvalley.edu",
    "password": "Admin@1234!"
  }
  ```
- **Backend Response:** Returns `accessToken`, `refreshToken`, and a `user` object.
- **UI Behavior:** 
  1. Save `accessToken` and `user` to the global Zustand store (`useAuthStore`).
  2. Save `refreshToken` to persistent storage (e.g., `localStorage` or `HttpOnly` cookie if configured).
  3. Redirect to `/dashboard/default`.

### C. Token Refresh (System / Background)
**Endpoint:** `POST /api/v1/auth/refresh`
**Purpose:** Exchanges an expired access token for a new set of tokens.
- **Frontend Payload:**
  ```json
  {
    "refreshToken": "<stored_refresh_token>"
  }
  ```
- **Trigger:** This is called **automatically** by the Axios Interceptor whenever *any* API request returns a `401 Unauthorized`. It is completely invisible to the user.

### D. Logout (Protected)
**Endpoint:** `POST /api/v1/auth/logout`
**Purpose:** Revokes the refresh token in the backend database.
- **Frontend Payload:**
  ```json
  {
    "refreshToken": "<stored_refresh_token>"
  }
  ```
- **UI Behavior:** 
  1. Call the logout endpoint (attaching the `Bearer <accessToken>`).
  2. Clear the Zustand store (`logout()` method).
  3. Clear persistent storage.
  4. Force redirect to `/auth/v1/login`.

---

## 2. JWT Session Management (The Axios Interceptor)

The frontend uses a strict 2-token system (`accessToken` + `refreshToken`).

### The Axios Request Interceptor
- Before every request, the interceptor pulls the `accessToken` from the Zustand store (or window object) and injects it into the `Authorization: Bearer <token>` header.

### The Axios Response Interceptor (Handling Expirations)
- When the backend returns a `401 Unauthorized`, the interceptor catches the error globally.
- **Logic Flow:**
  1. Pause all outgoing API requests.
  2. Fire a request to `POST /auth/refresh` with the `refreshToken`.
  3. If successful: Update the Zustand store with the new `accessToken`, attach the new token to the original failed request, and retry it automatically.
  4. If `refresh` fails (token expired/revoked): Call `useAuthStore.getState().logout()` and forcefully redirect the browser to `/auth/v1/login`.

---

## 3. Route Protection & Guards

### A. Next.js Middleware (Network Level Protection)
- All routes starting with `/dashboard/*` are protected.
- If the browser does not have a valid auth state, the middleware will immediately redirect the request to `/auth/v1/login`.

### B. Global Auth Store (Zustand)
- Location: `src/stores/auth.store.ts`
- Manages the `isAuthenticated` boolean and the current user's role (`userType`).
- Used by UI components to conditionally render elements (e.g., hiding a "Delete School" button if the user is a `STAFF` member instead of a `SUPER_ADMIN`).

### C. Permission Guards (UI Level)
- A `<PermissionGuard requiredRole="SUPER_ADMIN">` component wraps sensitive UI elements to ensure they do not render if the user's role in the Zustand store does not match.

---

## 4. Error Handling Map

The backend throws standard domain errors which the frontend maps to UI feedback:

| HTTP Code | Backend Error Code | Frontend UI Action |
|-----------|--------------------|--------------------|
| 401       | `INVALID_CREDENTIALS` | Show form error: "Invalid email or password." Clear password field. |
| 403       | `USER_SUSPENDED`    | Show form error: "Your account is suspended. Contact support." |
| 409       | `TENANT_EMAIL_EXISTS` | Show registration error: "This email is already registered to a school." |
| 409       | `ADMIN_EMAIL_EXISTS` | Show registration error: "An admin account with this email already exists." |
