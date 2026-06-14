# AI Debugging Session — HNSW Index Migration Fails Inside EF Core Transaction

**Rubric:** FS-7  
**Date:** 2026-06-13  
**Fix commit:** `f4d1c23`  
**Time to resolve:** ~45 min  
**Tools used:** Claude Code (primary), Postgres docs (verification)

---

## 1. Symptom

After adding `MenuItem.Embedding` (`vector(1536)`) and creating the `AddMenuItemEmbedding` EF Core migration, running `dotnet ef database update` (or the app's `Database.MigrateAsync()` on startup) threw:

```
Npgsql.PostgresException (0x80004005): 42P17: cannot create index concurrently within a transaction block
   at Npgsql.Internal.NpgsqlConnector.ReadMessage(...)
   at Microsoft.EntityFrameworkCore.Migrations.MigrationCommand.ExecuteNonQueryAsync(...)
```

The migration contained:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_menu_items_embedding_hnsw
ON menu_items
USING hnsw (embedding vector_cosine_ops);
```

The backend container would crash on startup with a 500, and the recommend endpoint was unreachable.

---

## 2. Context

The migration was generated the previous session when we added the pgvector extension and the `Embedding` column. The `CONCURRENTLY` keyword was added deliberately — it allows Postgres to build the index without taking an exclusive lock on the table, which is best practice for large tables in production (zero downtime).

However, EF Core wraps every migration in a **transaction block** by default. This is the conflict: Postgres simply does not allow `CREATE INDEX CONCURRENTLY` inside any transaction.

The error happens 100% of the time on a clean `MigrateAsync()` call. We only noticed it when the backend was wired to the real Postgres container; the in-memory EF test provider never runs migrations so CI had passed.

---

## 3. The prompts (in order)

**Prompt 1** — after seeing the crash log:
> "I'm getting this error when the backend starts: `cannot create index concurrently within a transaction block`. The stack trace points to the HNSW index line in my AddMenuItemEmbedding migration. The migration uses `CREATE INDEX CONCURRENTLY`. Why does this fail and how do I fix it?"

**Prompt 2** — follow-up to confirm the tradeoff:
> "If I remove CONCURRENTLY, will the migration lock the menu_items table? We have seed data but this is a dev/staging environment — is it safe to drop CONCURRENTLY?"

---

## 4. AI's hypotheses

**Hypothesis 1 (correct, first attempt):** EF Core wraps all migration SQL in a transaction by default. Postgres explicitly forbids `CREATE INDEX CONCURRENTLY` inside a transaction block — this is a hard constraint documented in the Postgres manual, not a version-specific bug. The error is deterministic.

Two fix options offered:

- **Option A (recommended for our case):** Remove `CONCURRENTLY`. The index is still built correctly; the only cost is a brief exclusive lock on `menu_items` during the index build. For a dev/staging table with seed data this is imperceptible.
- **Option B (for production zero-downtime):** Override `Migration.SuppressTransaction` to `true` for this specific migration, then keep `CONCURRENTLY`. This tells EF Core not to wrap the migration in a transaction. Riskier because a failed migration can't be automatically rolled back.

The AI recommended Option A for our immediate case ("you have seed data, not production traffic, just drop CONCURRENTLY") and noted Option B as the right path for the live prod migration if downtime is a concern.

**No dead ends** — the first hypothesis was correct and actionable in one round.

---

## 5. Root cause + fix

**Root cause:** `CREATE INDEX CONCURRENTLY` is a Postgres-level restriction. It cannot run inside a transaction. EF Core's migration runner opens a transaction before executing migration SQL, so the combination is a hard error with no workaround at the Postgres level — one of them has to give.

**Fix (commit `f4d1c23`):**

```diff
-CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_menu_items_embedding_hnsw
+CREATE INDEX IF NOT EXISTS ix_menu_items_embedding_hnsw
 ON menu_items
 USING hnsw (embedding vector_cosine_ops);
```

One word removed. Migration applies cleanly, backend starts, HNSW index is created and the cosine-similarity recommendation query uses it.

The same commit also forwarded `OPENAI_API_KEY` into the backend service in `docker-compose.yml` — unrelated but discovered in the same session.

---

## 6. Lesson learned

**`CONCURRENTLY` and transactions are mutually exclusive in Postgres — always.** The pattern of "add CONCURRENTLY for safety" is correct for `psql`/manual DBA work, but breaks the moment you run the DDL inside an ORM migration. The right default for EF Core migrations is to omit `CONCURRENTLY` (accept the brief lock) and only add it if you override `SuppressTransaction` for that specific migration.

**What I'd prompt differently next time:** Include the full stack trace in the first prompt rather than paraphrasing the error. The phrase "cannot create index concurrently within a transaction block" is a Postgres-verbatim error message — giving it to the AI verbatim means it matches documentation exactly and returns the correct answer in one round, not two.
