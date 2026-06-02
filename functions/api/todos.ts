import { desc } from "drizzle-orm";
import { z } from "zod";
import { todos } from "../../src/db/schema";
import { createDb, type Env } from "../_lib/db";
import { badRequest, json, serverError } from "../_lib/json";

const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const db = createDb(env);
    const rows = await db.select().from(todos).orderBy(desc(todos.createdAt));

    return json(rows);
  } catch (error) {
    return serverError(error);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const parsed = createTodoSchema.safeParse(await request.json());

    if (!parsed.success) {
      return badRequest("Todo title is required");
    }

    const db = createDb(env);
    const [row] = await db.insert(todos).values(parsed.data).returning();

    return json(row, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
};
