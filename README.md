# AlgoSaathi Backend

Node.js and Express API for authentication, user queries, file uploads, courses, news, templates, YouTube posts, and client content. Data is stored with MongoDB/Mongoose; uploaded images use Cloudinary when configured.

## Requirements

- Node.js `20+` (the current `node-cron` and Nodemailer security fixes require Node 20 or newer)
- npm
- MongoDB
- Configure Google OAuth, email, Cloudinary, and Gemini only for features that need them

## Local setup

From this directory:

```powershell
npm ci
```

Create `.env` from `.env.example` only if a local file does not already exist. Fill in credentials privately on your machine; never paste them into source code, commits, issue reports, or logs.

```powershell
npm run dev
```

The API listens on port `5000` by default. The health endpoints are `/` and `/api/health`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `development` locally and `production` in deployment |
| `PORT` | HTTP port; defaults to `5000` |
| `FRONTEND_URL` | Exact allowed frontend origin for CORS and account emails |
| `MONGODB_URI` | MongoDB connection URI prefix; current code appends the `portfolio_db` database name |
| `JWT_SECRET` | Private signing key for access tokens |
| `JWT_REFRESH_SECRET` | Separate private signing key for refresh tokens |
| `JWT_EXPIRE` | Access-token lifetime; defaults to `7d` |
| `JWT_REFRESH_EXPIRE` | Refresh-token lifetime; defaults to `30d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID used by Google sign-in |
| `EMAIL_SERVICE`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Outbound account email configuration |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary image-upload credentials |
| `MAX_FILE_SIZE` | Maximum image size in bytes; defaults to 5 MiB |
| `GEMINI_API_KEY` | Optional server-only key for automated learning/news generation |
| `AI_NEWS_ENABLED`, `AI_COURSE_ENABLED` | Set to `true` only to enable the respective scheduled jobs; disabled otherwise |
| `AI_NEWS_AUTHOR_NAME`, `AI_NEWS_AUTHOR_IMAGE` | Optional author metadata for generated news |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | Auth/API rate-limit settings |
| `LOG_LEVEL` | Winston log level; defaults to `debug` outside production and `info` in production |

`MONGODB_URI` is concatenated with the database name in `src/constnts.js`; use the URI format expected by that implementation. Never reuse the example JWT placeholders in a real environment. Keep all backend credentials server-side and use distinct, high-entropy access and refresh signing secrets.

## API route groups

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Registration, login, Google sign-in, email verification, password reset, and session endpoints |
| `/api/users` | Authenticated user/admin endpoints |
| `/api/fileUpload` | Authenticated profile image upload |
| `/api/user` | Public enquiry submission and protected admin query listing |
| `/api/course` | Course content and course administration |
| `/api/news` | News content and administration |
| `/api/template` | Template library and administration |
| `/api/client` | Client content and administration |
| `/api/youtube` | YouTube content and administration |

Authentication and role authorization are implemented in `src/middleware/auth.js` and route modules. Preserve those boundaries when adding endpoints. Upload middleware currently accepts images and defaults to a 5 MiB size limit.

## Scripts and checks

The backend currently defines `npm run dev`; it does not yet define a test or lint script. Useful checks:

```powershell
npm audit --registry=https://registry.npmjs.org/
node --check src/server.js
```

For a code change, also run `node --check` on every touched JavaScript module and manually exercise the related API flow in a non-production environment. Do not run the app with production credentials for routine checks.

## Production checklist

- Use HTTPS, a production MongoDB account with least privilege, and a private secret manager.
- Set `NODE_ENV=production` and `FRONTEND_URL` to the exact deployed frontend origin.
- Keep secrets out of Git, client bundles, logs, responses, and screenshots. Rotate any credential that may have been committed or exposed.
- Keep the npm lockfile committed and review dependency audit findings. Never use `npm audit fix --force` without reviewing every major-version change.
- Keep AI scheduled jobs disabled unless they are intentionally configured and monitored.
- Verify email delivery, OAuth origin configuration, CORS, Cloudinary access, upload limits, and database backups in the deployment environment.