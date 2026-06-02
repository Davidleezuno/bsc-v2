import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/db/schema";

export interface Env {
  HYPERDRIVE?: Hyperdrive;
  DATABASE_URL?: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY?: string;
}

export function createDb(env: Env) {
  const connectionString = getConnectionString(env);
  const isHyperdriveConnection = Boolean(env.HYPERDRIVE?.connectionString);

  const client = postgres(connectionString, {
    connect_timeout: 5,
    fetch_types: false,
    idle_timeout: 5,
    max: isHyperdriveConnection ? 5 : 1,
    prepare: false,
    ...(isHyperdriveConnection ? {} : { ssl: "require" as const }),
  });

  return drizzle(client, { schema });
}

function getConnectionString(env: Env) {
  if (env.HYPERDRIVE?.connectionString) {
    return env.HYPERDRIVE.connectionString;
  }

  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  throw new Error("HYPERDRIVE binding or DATABASE_URL is not configured");
}
