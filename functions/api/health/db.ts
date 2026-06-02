import { sql } from "drizzle-orm";
import { createDb, type Env } from "../../_lib/db";
import { json, serverError } from "../../_lib/json";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const db = createDb(env);
    const result = await withTimeout(
      db.execute<{ now: string }>(sql`select now() as now`),
      4_000
    );
    const firstRow = result[0];

    return json({
      ok: true,
      databaseTime: firstRow?.now ?? null,
    });
  } catch (error) {
    return serverError(error);
  }
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database health check timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}
