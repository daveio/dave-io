# Three Tasks

You don't need to back anything up, we have committed to source control. Don't run linters. We'll do that afterward. If you need to run any commands, do so at the beginning, so that I can leave you to it without being prompted for permissions.

## Task 1

- I have renamed `auth-test.ts` to `auth.ts`. Update imports and references in all documentation.
- Change its functionality so that it accepts any JWT subject, and returns information about the JWT provided (including the subject, and the subject split according to colons as we use them). Other details about the JWT too. It should still ensure that the JWT is valid, returning an error if it is not.

---

## Task 2

- Check that we're using OpenAPI schema validation for both GET and POST in the AI endpoint.
- Also check the other endpoints are using OpenAPI schema validation. If not, implement it.
- Using TypeScript ignore comments to deal with `chanfana`/`zod` compatibility issues is fine.

---

## Task 3

- The files are getting very big. For the big endpoints, create smaller files in a subdirectory. - For example, for AI, `src/endpoints/ai/index.ts`, `src/endpoints/ai/[CONCERN].ts`. Then modify the code to import the subdirectory.
- In the process, extract methods and shared variables to remove code duplication as much as possible and create separation of concerns.

---

## Final cleanup

- Update all documentation (`*.md`). You can ignore `PROMPT.md` as it is a temporary file.
