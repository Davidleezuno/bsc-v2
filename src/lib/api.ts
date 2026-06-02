import { z } from "zod";

const todoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const healthSchema = z.object({
  ok: z.boolean(),
  databaseTime: z.string().nullable(),
});

export type TodoDto = z.infer<typeof todoSchema>;
export type DbHealth = z.infer<typeof healthSchema>;

export async function getDbHealth(): Promise<DbHealth> {
  const response = await fetchWithTimeout("/api/health/db", 6_000);
  const json = await readJson(response);

  if (!response.ok) {
    throw new Error(readError(json, "Database health check failed"));
  }

  return healthSchema.parse(json);
}

async function fetchWithTimeout(input: RequestInfo | URL, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function listTodos(): Promise<TodoDto[]> {
  const response = await fetch("/api/todos");
  const json = await readJson(response);

  if (!response.ok) {
    throw new Error(readError(json, "Could not load todos"));
  }

  return z.array(todoSchema).parse(json);
}

export async function createTodo(title: string): Promise<TodoDto> {
  const response = await fetch("/api/todos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const json = await readJson(response);

  if (!response.ok) {
    throw new Error(readError(json, "Could not create todo"));
  }

  return todoSchema.parse(json);
}

function readError(json: unknown, fallback: string) {
  const parsed = z.object({ error: z.string() }).safeParse(json);

  return parsed.success ? parsed.data.error : fallback;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}
