"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/lib/AppDataContext";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { apiRequest } from "@/lib/apiClient";
import { CURRENCIES } from "@/lib/constants";
import type { Budget } from "@/lib/types";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { me, refresh } = useAppData();
  const push = usePushSubscription();

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"Weekly" | "Monthly">("Monthly");
  const [currency, setCurrency] = useState("NGN");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(true);

  // Profile Form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setProfileName(me.name);
      setProfileEmail(me.email);
    }
  }, [me]);

  useEffect(() => {
    async function loadBudget() {
      try {
        setLoadingBudget(true);
        const data = await apiRequest<{ budget: Budget | null }>("/api/budget");
        if (data.budget) {
          setAmount(String(data.budget.amount));
          setPeriod(data.budget.period as "Weekly" | "Monthly");
          setCurrency(data.budget.currency);
        }
      } catch (err) {
        console.error("Failed to load budget", err);
      } finally {
        setLoadingBudget(false);
      }
    }
    loadBudget();
  }, []);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setProfileSaving(true);
    try {
      await apiRequest("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      setProfileSaved(true);
      await refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveBudget(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Please enter a budget amount greater than 0");
      }
      const data = await apiRequest<{ budget: Budget }>("/api/budget", {
        method: "PUT",
        body: JSON.stringify({ amount: parsedAmount, period, currency }),
      });
      if (data.budget) {
        setAmount(String(data.budget.amount));
        setPeriod(data.budget.period as "Weekly" | "Monthly");
        setCurrency(data.budget.currency);
      }
      setSaved(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Settings</h1>
      </div>

      <div className={styles.grid}>
        <Panel accent="emerald">
          <h3>Budget Vault Settings</h3>
          {loadingBudget ? (
            <div style={{ color: "var(--text-dim)", padding: "1rem 0", fontSize: "0.85rem" }}>
              Loading budget settings...
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSaveBudget}>
              {error ? <div className={styles.errorMsg}>{error}</div> : null}
              {saved ? <div className={styles.saveMsg}>Budget updated successfully!</div> : null}
              <Field label="Amount" htmlFor="budget-amount">
                <Input
                  id="budget-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Period" htmlFor="budget-period">
                <Select id="budget-period" value={period} onChange={(e) => setPeriod(e.target.value as "Weekly" | "Monthly")}>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </Select>
              </Field>
              <Field label="Currency" htmlFor="budget-currency">
                <Select id="budget-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {Object.keys(CURRENCIES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" variant="emerald" disabled={saving}>
                {saving ? "Saving..." : "Save Budget Vault ↗"}
              </Button>
            </form>
          )}
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Panel accent="gold">
            <h3>Profile & Account</h3>
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.85rem" }}>
              {profileError ? <div className={styles.errorMsg}>{profileError}</div> : null}
              {profileSaved ? <div className={styles.saveMsg}>Profile updated!</div> : null}

              <Field label="Display Name" htmlFor="profile-name">
                <Input
                  id="profile-name"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </Field>

              <Field label="Email Address" htmlFor="profile-email">
                <Input
                  id="profile-email"
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </Field>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Button type="submit" variant="primary" size="sm" disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save changes"}
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            </form>

            <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem" }}>
              <div className={styles.profileRow}>
                <span className={styles.profileLabel}>Level</span>
                <span>LV {me?.level ?? 1}</span>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.profileLabel}>Longest streak</span>
                <span>{me?.longestStreak ?? 0} days</span>
              </div>
            </div>
          </Panel>

          <Panel accent="violet">
            <h3>Notifications</h3>
            <div className={styles.pushRow}>
              <span className={`${styles.pushStatus} ${push.subscribed ? styles.statOn : ""}`}>
                {!push.supported
                  ? "Not supported in this browser"
                  : push.loading
                  ? "Checking..."
                  : push.subscribed
                  ? "Reminders are ON"
                  : "Reminders are OFF"}
              </span>
              {push.supported ? (
                <Button
                  variant={push.subscribed ? "ghost" : "violet"}
                  size="sm"
                  onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                >
                  {push.subscribed ? "Turn off" : "Turn on"}
                </Button>
              ) : null}
            </div>
            {push.error ? <div className={styles.errorMsg} style={{ marginTop: "0.5rem" }}>{push.error}</div> : null}
            <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: "0.6rem" }}>
              We&apos;ll nudge you about quests due today and remind you to log spending if you haven&apos;t by
              the evening.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
