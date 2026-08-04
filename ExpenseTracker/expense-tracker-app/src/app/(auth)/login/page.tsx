"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel accent="gold">
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        {error ? <div className={styles.error}>{error}</div> : null}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="primary" full disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
        <div className={styles.switch}>
          New here? <Link href="/register">Create an account</Link>
        </div>
      </form>
    </Panel>
  );
}
