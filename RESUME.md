# API Response Refactoring Progress

## Current Status

We've been working on refactoring the API response structure across all endpoints to consistently use a standardized response object. Here's what we've accomplished so far:

### Completed Tasks

1. **Refactored `createApiResponse` utility**:
   - Changed to use a single options object parameter instead of positional arguments
   - Added `redirect` parameter support for clean URL redirects (302 Found by default)
   - Added `code` parameter support for custom HTTP status codes
   - Ensured proper error handling and status code management

2. **Updated multiple endpoints to use the new object parameter pattern**:
   - Ticket endpoints (title, description, enrich)
   - AI endpoints (alt GET and POST)
   - Token management endpoints (uuid, usage, revoke)
   - Dashboard endpoint
   - Images/optimise endpoint
   - Ping endpoint
   - Go endpoint (updated to use the new redirect parameter)

3. **API Response Structure**:
   All endpoints have been updated to use the consistent structure:
   ```typescript
   {
     ok: boolean,
     result: T,  // Always present on success
     error: string | null, // null on success, error message on failure
     status: { message: string } | null, // Present but nullable
     timestamp: string
   }
   ```

### Remaining Tasks

1. **Check remaining endpoints** to ensure all are using the new object parameter pattern
2. **Run tests** to verify all changes work correctly
3. **Fix any remaining type errors or test failures** related to the refactoring
4. **Check documentation** to ensure it's up to date with the new structure

## Next Steps

1. Continue updating any remaining endpoints to use the new object parameter pattern
2. Run `bun run test` to verify all tests pass
3. Run `bun run build` and `bun run lint:biome` to check for any type or lint errors
4. Address any failed tests or type errors that might appear

## Implementation Details

The `createApiResponse` function now takes a single options object:

```typescript
export interface ApiResponseOptions<T> {
  result: T
  message?: string | null
  error?: string | null
  meta?: ApiResponse<T>["meta"]
  redirect?: string | null
  code?: number
}

export function createApiResponse<T>(options: ApiResponseOptions<T>): ApiSuccessResponse | ApiErrorResponse {
  // Implementation...
}
```

All endpoint calls have been updated from the old positional parameter pattern to the new object parameter pattern:
```typescript
// OLD (deprecated):
createApiResponse(result, message, error)

// NEW (current):
createApiResponse({
  result: resultObject,
  message: "Success message",
  error: null
})
```

The `/go` endpoint now uses the redirect parameter for cleaner redirection:
```typescript
createApiResponse({
  result: { /* data */ },
  message: `Redirecting to ${url}`,
  error: null,
  redirect: url
})
```

## Copy of the current planning tool plan

### Notes
- User wants all API responses to use a `result` object for variable fields (e.g., description, title, etc.).
- The `timestamp` property should remain at the top level of the response, not inside `result`.
- This structure should be implemented in all relevant endpoints (description, enrich, title).
- All endpoints should be updated to use the refactored `createApiResponse` utility for consistency, type safety, and sorting.
- Track migration endpoint-by-endpoint, updating code, docs, and tests for each.
- This change may affect all endpoints using createApiResponse; ensure global compatibility.
- Update all relevant schema/type definitions to match the new API response structure with `result` object.
- Ensure all endpoints, including non-ticket endpoints, use the new createApiResponse signature with explicit error and status fields for both success and failure cases.
- [x] Update `ApiSuccessResponseSchema` (and related error schema if needed) to use `result` instead of `data`
- No backwards compatibility or migration logic should be added (see AGENTS.md rules).
- All endpoints must return JSON with variable data inside `result`, and only `ok`, `error`, `timestamp`, and a top-level `status` object at the top level. The `status` object should contain the status message or be null if no status message is passed.
- All schemas, tests, and documentation must be updated to match the new structure, and all code quality checks (linters, typechecks, tests) must pass per AGENTS.md rules.
- All tests, mocks, and documentation must be updated to expect the new structure (including the `status` field) to always be present (nullable) on all responses. This includes ensuring that all tests and mocks account for the possibility of a null `status` field. Additionally, all test and type errors related to the new structure must be fixed, with a focus on ensuring that `result` is always present and not optional. This is a key focus in the migration.
- A thorough review of all code, tests, and mocks is required to ensure that all test and type errors relating to the always-present (nullable) status field are fixed, and that seamless integration and accurate error handling are achieved.
- Tracking endpoint migrations individually ensures that all necessary updates to code, docs, and tests are completed for each endpoint.
- All endpoint responses must include an `error` field: when `ok` is true, `error` must be present and set to null; when `ok` is false, `error` must be present and set to the error message. All endpoint migrations must include this field.
- Track inclusion of the `error` field for every migrated endpoint.
- createApiResponse should now build the outer response object (`ok`, `error`, `timestamp`, `status`) and wrap the result. The function should take the result object, a status message (or null), and an error message (or null). If error is null, `ok` is true and `error` is null; if error is a string, `ok` is false and `error` is the message. The `status` field should be present and contain the status message or be null.
- All schemas, endpoints, and tests must be updated so that `result` is always present (not optional) on success responses, and all type errors and test failures relating to this must be fixed.
- All schemas, endpoints, and tests must be updated so that `status` is always present (nullable) on all responses, and all type errors and test failures relating to this must be fixed.
- ⚠️ When calling createApiResponse, do not pass a message string unless you intend it as a success message. Only pass an error string to the error parameter to trigger an error response. Audit all usages to ensure this rule is followed.
- Use separate parameters for status messages and error messages in createApiResponse, and detect error presence based on the error parameter. Update the function signature and all usages accordingly.
- **Explicit Note:** Status must always be present (nullable) on all responses, and type errors/test failures relating to this must be fixed.
- All future endpoint migrations must use the new createApiResponse signature and include the `status` field as specified.
- Add an optional `redirect` parameter to `createApiResponse`. If set to a URL, respond with 302 Found and set the Location header; if unset, proceed normally.
- Add an optional `code` parameter to `createApiResponse`. If set, use that HTTP status code. If unset: for successes, use 200 OK; for failures, use 500 Internal Server Error. 404s should bubble through as normal.
- Remove any custom status code handling in endpoints and use the new system.
- `/go` endpoint redirects should use the new `redirect` parameter; setting `redirect` implies a 302 Found status and no need to override `code`.
- Update all endpoints to use the new `redirect` and `code` parameters in createApiResponse.
- Actively migrating all usages of createApiResponse in endpoints and utilities to use the object-parameter calling convention (in progress)
- [x] Migrate all usages of createApiResponse in endpoints and utilities that have already been updated to use the new object-parameter calling convention
- [ ] Continue updating remaining usages of createApiResponse in endpoints and utilities to use the new object-parameter calling convention for clarity, maintainability, and to avoid errors with skipped/optional parameters.
- Next steps:
  - Review all endpoints and utilities for remaining usages of createApiResponse that need to be updated to the object-parameter calling convention.
  - Update the remaining usages to use the new object-parameter calling convention.
  - Verify that all usages of createApiResponse have been updated and that the codebase is consistent.

#### Task List
- [x] Update `description.post.ts` to use `result` and move `timestamp` to top level
- [x] Update `enrich.post.ts` to use `result` and move `timestamp` to top level
- [x] Update `title.post.ts` to use `result` and move `timestamp` to top level
- [x] Update `ai/alt.get.ts` to use createApiResponse with new structure
- [x] Update `ai/alt.post.ts` to use createApiResponse with new structure and object-parameter calling convention
- [ ] Audit and update every endpoint (not just tickets) to ensure JSON returned is always wrapped in `{ ok, result, error, status, timestamp }` structure
  - [x] Update createApiResponse utility to always use result object
  - [x] Refactor createApiResponse to enforce new contract (outer object construction based on error arg, status object included)
  - [ ] For each endpoint found not using the new structure, update to use `{ ok, result, error, status, timestamp }` via createApiResponse (with result, status message, and error arg)
  - [ ] Track each endpoint migration individually and update docs/tests as you go
  - [ ] Ensure all endpoints, including non-ticket endpoints, use the new createApiResponse signature with explicit error and status fields for both success and failure cases
  - [x] Update scripts in the bin directory if they interact with API response logic
  - [ ] Update endpoint-specific docs and tests as endpoints are migrated
  - [ ] Update all relevant documentation to reflect new API response structure
  - [ ] Ensure all linters, typechecks, and tests pass after changes
  - [ ] Track endpoint migrations:
    - [x] description.post.ts (ensure error/status fields present)
    - [x] enrich.post.ts (ensure error/status fields present)
    - [x] title.post.ts (ensure error/status fields present)
    - [x] ai/alt.get.ts (ensure error/status fields present)
    - [x] ai/alt.post.ts (ensure error/status fields present, use new signature and object-parameter calling convention)
    - [x] tokens/[uuid]/revoke.post.ts (ensure error/status fields present, use new signature and object-parameter calling convention, migrated to new object-parameter calling convention)
    - [x] tokens/[uuid]/[...path].get.ts (ensure error/status fields present, use new signature and object-parameter calling convention, migrated to new object-parameter calling convention)
    - [x] tokens/[uuid].get.ts (ensure error/status fields present, use new signature and object-parameter calling convention, migrated to new object-parameter calling convention)
    - [x] dashboard/[name].get.ts (ensure error/status fields present, use new signature and object-parameter calling convention, migrated to new object-parameter calling convention, migrated to object-parameter calling convention)
    - [x] images/optimise.ts (ensure error/status fields present, use new signature and object-parameter calling convention)
    - [x] ping.get.ts (ensure error/status fields present, use new signature and object-parameter calling convention)
    - [x] ping.get.ts (ensure error/status fields present, use new signature and object-parameter calling convention)
    - [x] images/optimise.ts (ensure error/status fields present, use new signature and object-parameter calling convention)
    - [x] ping.get.ts (ensure error/status fields present, use new signature and object-parameter calling convention)
    - [x] routes/go/[slug].get.ts (ensure error/status fields present, use new signature and object-parameter calling convention, uses redirect parameter)
    - [ ] Update endpoint 1 (ensure error/status fields present, use new signature and object-parameter calling convention)
    - [ ] ...
  - [ ] Update all endpoints, schemas, and tests to include the required `error` and `status` fields
  - [ ] Fix all type errors and test failures so that `result` is always present (not optional) and tests/types expect this
  - [ ] Audit all usages of createApiResponse to ensure correct usage of message vs error string and status field
  - [ ] Add `redirect` parameter support to createApiResponse and update endpoints (including `/go`) to use it for redirects
  - [ ] Add `code` parameter support to createApiResponse and update endpoints to use it for custom status codes; remove custom status code handling elsewhere
  - [ ] Implement `redirect` and `code` parameters in createApiResponse, update endpoints to use them, refactor to options object calling convention, and remove custom status code handling
  - [ ] Migrate all usages of createApiResponse to use a single options object parameter instead of positional arguments (in progress)
  - [x] Migrate all usages of createApiResponse that have already been updated to use the new object-parameter calling convention
  - [x] images/optimise.ts
  - [x] ping.get.ts
  - [x] tokens/[uuid].get.ts
  - [x] dashboard/[name].get.ts
  - [ ] Continue updating remaining usages of createApiResponse in the codebase to use the new object-parameter calling convention

### Current Goal
Continue updating remaining usages of createApiResponse to use the object-parameter calling convention.
