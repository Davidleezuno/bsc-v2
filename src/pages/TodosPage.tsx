import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTodo, listTodos } from "../lib/api";

export function TodosPage() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const todos = useQuery({
    queryKey: ["todos"],
    queryFn: listTodos,
  });

  const addTodo = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      setTitle("");
      void queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (trimmedTitle.length > 0) {
      addTodo.mutate(trimmedTitle);
    }
  }

  return (
    <section className="panel">
      <div>
        <p className="eyebrow">Drizzle sample route</p>
        <h1>Todos</h1>
        <p className="lede">
          This route exercises TanStack Query, a Cloudflare Pages Function, and
          a Drizzle insert/select against Supabase Postgres.
        </p>
      </div>

      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          aria-label="Todo title"
          placeholder="Add a todo"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="submit" disabled={addTodo.isPending}>
          {addTodo.isPending ? "Adding" : "Add"}
        </button>
      </form>

      {todos.isLoading ? <p>Loading todos...</p> : null}
      {todos.isError ? <p className="error">{todos.error.message}</p> : null}
      {addTodo.isError ? <p className="error">{addTodo.error.message}</p> : null}

      <ul className="todo-list">
        {todos.data?.map((todo) => (
          <li key={todo.id}>
            <span>{todo.title}</span>
            <time dateTime={todo.createdAt}>
              {new Date(todo.createdAt).toLocaleDateString()}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
