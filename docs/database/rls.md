# Row Level Security Policy Matrix

> See `supabase/migrations/20260607000013_create_rls_policies.sql` for SQL.

---

## Design Principles

1. **RLS is enabled on all tables** — no table is accessible without an explicit policy.
2. **Service role bypasses RLS** — used exclusively by server-side admin operations
   and the import pipeline (`SUPABASE_SERVICE_ROLE_KEY`).
3. **Anon key = public read only** — no writes from the client side.
4. **Draft/archived data is never public** — only `published` and `discontinued` are readable.

---

## Policy Matrix

| Table                   | Anon SELECT              | Anon INSERT | Anon UPDATE | Anon DELETE |
| ----------------------- | ------------------------ | ----------- | ----------- | ----------- |
| brands                  | ✓ all                    | ✗           | ✗           | ✗           |
| ball_families           | ✓ published/discontinued | ✗           | ✗           | ✗           |
| ball_versions           | ✓ published/discontinued | ✗           | ✗           | ✗           |
| technical_specs         | ✓ if version visible     | ✗           | ✗           | ✗           |
| visual_signatures       | ✓ if version visible     | ✗           | ✗           | ✗           |
| identification_features | ✓ if version visible     | ✗           | ✗           | ✗           |
| images                  | ✓ if version visible     | ✗           | ✗           | ✗           |
| segments                | ✓ all                    | ✗           | ✗           | ✗           |
| version_segments        | ✓ if version visible     | ✗           | ✗           | ✗           |
| sources                 | ✓ all                    | ✗           | ✗           | ✗           |
| price_observations      | ✓ if version visible     | ✗           | ✗           | ✗           |

**Service role (server-only):** full access, bypasses all policies.

---

## Future Phases

- **Phase 4 (Admin):** Add role-based policies for authenticated admin users.
  Pattern: `auth.jwt() ->> 'role' = 'admin'`
- **Phase 5 (Image ID):** Users can INSERT into `identification` storage bucket.
- **Phase 6 (API):** API key–based access via `auth.jwt()` claims.

---

## Storage Buckets

| Bucket           | Public | Policy                                   |
| ---------------- | ------ | ---------------------------------------- |
| `ball-images`    | Yes    | Public SELECT                            |
| `identification` | No     | Service role only (Phase 5: user upload) |
| `admin-assets`   | No     | Service role only                        |
