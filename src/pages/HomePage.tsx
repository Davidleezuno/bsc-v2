import { useQuery } from "@tanstack/react-query";
import { getDbHealth } from "../lib/api";
import { supabase } from "../lib/supabase";

export function HomePage() {
  const health = useQuery({
    queryKey: ["db-health"],
    queryFn: getDbHealth,
    retry: 1,
  });

  return (
    <section className="panel">
      <div>
        <p className="eyebrow">React x TanStack x Drizzle</p>
        <h1>Cloudflare-ready app shell</h1>
        <p className="lede">
          A compact starting point with a typed React client, Pages Functions,
          and Supabase Postgres access through Drizzle.
        </p>
      </div>

      <div className="status-grid">
        <article className="status-card">
          <span>Supabase client</span>
          <strong>{supabase ? "Configured" : "Missing env"}</strong>
        </article>
        <article className="status-card">
          <span>Database</span>
          <strong>
            {health.isLoading
              ? "Checking"
              : health.isError
                ? "Unavailable"
                : "Connected"}
          </strong>
          {health.data?.databaseTime ? (
            <small>{health.data.databaseTime}</small>
          ) : null}
          {health.isError ? <small>{health.error.message}</small> : null}
        </article>
      </div>
    </section>
  );
}
