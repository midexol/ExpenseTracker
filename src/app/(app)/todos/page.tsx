"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/lib/AppDataContext";
import { apiRequest, clientTimezoneOffset } from "@/lib/apiClient";
import { PRIORITIES, todayLocalString } from "@/lib/constants";
import { TODO_XP } from "@/lib/gamification";
import type { GamificationResult, Todo } from "@/lib/types";
import styles from "./todos.module.css";

const EMPTY_FORM = { title: "", notes: "", dueDate: "", priority: "Med" as (typeof PRIORITIES)[number] };

const PRIORITY_COLOR: Record<string, "coral" | "gold" | "blue"> = {
  High: "coral",
  Med: "gold",
  Low: "blue",
};

export default function TodosPage() {
  const { refresh, notifyUnlocks } = useAppData();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const data = await apiRequest<{ todos: Todo[] }>("/api/todos");
    setTodos(data.todos);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const active = useMemo(() => todos.filter((t) => !t.completed), [todos]);
  const completed = useMemo(() => todos.filter((t) => t.completed), [todos]);
  const today = todayLocalString();

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setForm({
      title: todo.title,
      notes: todo.notes ?? "",
      dueDate: todo.dueDate ?? "",
      priority: todo.priority,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        notes: form.notes || null,
        dueDate: form.dueDate || null,
        priority: form.priority,
      };
      if (editingId) {
        await apiRequest(`/api/todos/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...payload, timezoneOffset: clientTimezoneOffset() }),
        });
      } else {
        await apiRequest("/api/todos", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleComplete(todo: Todo) {
    const result = await apiRequest<GamificationResult>(`/api/todos/${todo.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !todo.completed, timezoneOffset: clientTimezoneOffset() }),
    });
    notifyUnlocks(result.newlyUnlocked);
    await Promise.all([load(), refresh()]);
  }

  async function handleDelete(id: string) {
    await apiRequest(`/api/todos/${id}`, { method: "DELETE" });
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Quests</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.side}>
          <Panel accent="violet">
            <h3>{editingId ? "Edit Quest" : "New Quest"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.85rem" }}>
              {error ? <div style={{ color: "var(--coral)", fontSize: "0.8rem" }}>{error}</div> : null}
              <Field label="Title" htmlFor="todo-title">
                <Input
                  id="todo-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Pay rent, gym, call mum..."
                />
              </Field>
              <Field label="Notes" htmlFor="todo-notes">
                <Textarea
                  id="todo-notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>
              <Field label="Due date" htmlFor="todo-due">
                <Input
                  id="todo-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </Field>
              <Field label="Priority" htmlFor="todo-priority">
                <Select
                  id="todo-priority"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as (typeof PRIORITIES)[number] }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} · +{TODO_XP[p]} XP
                    </option>
                  ))}
                </Select>
              </Field>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button type="submit" variant="violet" full disabled={submitting}>
                  {editingId ? "Save changes" : "Add quest"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </Panel>
        </div>

        <Panel>
          <div className={styles.sectionTitle}>Active — {active.length}</div>
          {loading ? (
            <div className={styles.empty}>Loading...</div>
          ) : active.length === 0 ? (
            <div className={styles.empty}>No active quests. Add one to start earning XP.</div>
          ) : (
            active.map((todo) => (
              <div className={styles.row} key={todo.id}>
                <button
                  className={styles.checkbox}
                  onClick={() => toggleComplete(todo)}
                  aria-label="Mark complete"
                />
                <div className={styles.titleBlock}>
                  <div className={styles.title}>{todo.title}</div>
                  {todo.notes ? <div className={styles.notes}>{todo.notes}</div> : null}
                </div>
                <Badge className={styles.priorityBadge} color={PRIORITY_COLOR[todo.priority]}>{todo.priority}</Badge>
                <span className={`${styles.due} ${todo.dueDate && todo.dueDate < today ? styles.dueOverdue : ""}`}>
                  {todo.dueDate ?? ""}
                </span>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => startEdit(todo)} aria-label="Edit">
                    ✎
                  </button>
                  <button className={styles.iconBtn} onClick={() => handleDelete(todo.id)} aria-label="Delete">
                    ×
                  </button>
                </div>
              </div>
            ))
          )}

          {completed.length > 0 ? (
            <>
              <div className={styles.sectionTitle}>Completed — {completed.length}</div>
              {completed.map((todo) => (
                <div className={styles.row} key={todo.id}>
                  <button
                    className={`${styles.checkbox} ${styles.checkboxChecked}`}
                    onClick={() => toggleComplete(todo)}
                    aria-label="Mark incomplete"
                  >
                    ✓
                  </button>
                  <div className={styles.titleBlock}>
                    <div className={`${styles.title} ${styles.titleDone}`}>{todo.title}</div>
                  </div>
                  <span className={styles.xpTag}>+{todo.xpValue} XP</span>
                  <span />
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} onClick={() => handleDelete(todo.id)} aria-label="Delete">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
