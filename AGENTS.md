# Backend Agent Rules

These rules apply to changes in `algosaathi_backend`.

## Protect existing behavior

- Trace the controller, route, middleware, service/DBC, model, and frontend caller before changing an API.
- Preserve current endpoint paths, response shapes, authentication, role checks, and database behavior unless the user explicitly requests a contract change.
- Keep changes focused. Do not rename, delete, or migrate existing features as cleanup.
- Ask before destructive data operations, schema migrations, changing production configuration, or introducing a new external provider.
- Run `node --check` on touched JavaScript files and `npm audit --registry=https://registry.npmjs.org/` after dependency changes. Do not claim a backend test suite exists unless one is configured.

## Secrets and sensitive data

- Never open, print, copy, commit, upload, or paste `.env`, credentials, tokens, private keys, production data, or personal user data into prompts, logs, screenshots, or external tools.
- If a task appears to require a secret value, stop and get explicit user permission. Use environment variable names and `.env.example` placeholders for setup work.
- Never log request bodies, passwords, authorization headers, cookies, JWTs, reset/verification tokens, user records, email addresses, phone numbers, uploaded file objects, provider responses, or `process.env` values.
- Log only minimal, sanitized metadata. Do not include raw URLs when path parameters may contain secrets.
- Do not return stack traces, database errors, filesystem paths, provider errors, or secrets to API clients.
- Never use production credentials or send test requests to production services without explicit permission.

## Security and dependency rules

- Validate and constrain untrusted request input; retain role/ownership checks on protected resources.
- Preserve password hashing, token expiry, secure cookie attributes, upload file-type/size limits, CORS restrictions, Helmet, and rate limits.
- Treat credentials as server-only. Never use `VITE_` variables or expose backend secrets in frontend code.
- Do not run `npm audit fix --force`. Review direct and transitive fixes, major-version notes, Node engine requirements, and affected APIs before upgrading.
- Do not disable a security control to make a test pass. Report confirmed issues and unresolved audit findings with severity and exact affected package/configuration.

## Validation

- Prefer focused checks before broad checks. Run dependency audits with the configured registry if the default registry does not support the audit API.
- Keep `.env.example` secret-free. Add new required variables there with obvious placeholders and document their purpose in `README.md`.
- Never overwrite a developer's existing `.env`; create one from `.env.example` only when no local file exists.