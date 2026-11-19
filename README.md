# aws_study

Notes-in-code from learning how to put an LLM API behind AWS without exposing the key. I worked on
this in November 2025, and it's what the backend of
[linear-archive-lambda](https://github.com/minseok05423/linear-archive-lambda) grew out of.

The setup it builds toward: a React app signs users in with Supabase. It calls API Gateway with the
Supabase access token. A Lambda authorizer checks the token, and only then does the request reach a
Lambda that holds the DeepSeek key and forwards the call.

## What's in here

**`api_gateway/jwt-auth-test/`** is the first step. A TOKEN-type Lambda authorizer verifies an HS256
JWT signed with a shared secret (`process.env.key`) and returns an Allow or Deny IAM policy.
`auth_study/backend/fodder/tokenGenerator.js` makes test tokens for it.

**`auth_study/backend/auth/`** is the same authorizer, but for real Supabase tokens. It fetches the
project's public keys from `/auth/v1/.well-known/jwks.json` (cached for 10 minutes) and verifies the
token against them, so no shared secret is needed.

**`auth_study/backend/deepseek/`** is the protected Lambda. It passes the request body to DeepSeek's
chat completions endpoint and gives up after 20 s.

**`auth_study/frontend/`** is a Vite + React + TypeScript app with these parts:

- Supabase email sign-up and log-in, with the session kept in a React context
  (`components/auth/`)
- a page that calls the DeepSeek Lambda with the session token (`hooks/useDeepseek.ts`)
- an image uploader that writes to a Supabase Storage bucket under the user's id and reads the images
  back (`utils/imageBucket.ts`, `hooks/useImageFetch.ts`)

```bash
cd auth_study/frontend
npm install
npm run dev
```

## Notes

Each Lambda folder has its `node_modules` and a ready-made `.zip` committed, because that zip is what
gets uploaded to Lambda. That's why the repo has about 3,400 files.

`auth_study/frontend/.env` and `fodder/supabase.ts` contain a Supabase URL and anon key. Anon keys
are meant to be public (row level security is what protects the data), but `tokenGenerator.js` also
has the HS256 test secret written in it. Anyone who reads it could sign tokens that the
`jwt-auth-test` authorizer accepts, so that secret shouldn't be used for anything that's still
deployed.
