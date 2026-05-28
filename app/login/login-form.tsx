"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not log in.");
      return;
    }

    router.replace(nextPath || "/");
    router.refresh();
  }

  return (
    <form className="panel form login-panel" onSubmit={submit}>
      <div>
        <p className="eyebrow">Local access</p>
        <h1>Login</h1>
        <p>Use the local username and password from your environment file.</p>
      </div>
      <label>
        Username
        <input name="username" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <div className="error">{error}</div> : null}
      <button type="submit" disabled={busy}>
        {busy ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
