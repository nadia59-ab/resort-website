"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/src/lib/supabase-browser";
import { adminLabel, type AdminLanguage } from "../admin-language";
import { useAdminLanguage } from "../use-admin-language";

export default function AdminLoginForm() {
  const [language, setLanguage] = useAdminLanguage();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });

      if (authError) {
        setError(adminLabel(language, "loginError"));
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError(adminLabel(language, "loginError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-app admin-login" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <div className="admin-login-topbar">
        <Link className="admin-brand" href="/" aria-label={adminLabel(language, "resort")}>
          <span className="admin-brand-mark" aria-hidden="true">✳</span>
          <span>RED SEA <i>RESORT</i></span>
        </Link>
        <label className="admin-language-control">
          <span className="sr-only">{adminLabel(language, "language")}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as AdminLanguage)}>
            <option value="ar">العربية</option>
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="de">DE</option>
          </select>
        </label>
      </div>

      <section className="admin-login-card">
        <p className="admin-eyebrow">{adminLabel(language, "ownerPanel")}</p>
        <h1>{adminLabel(language, "welcome")}</h1>
        <p className="admin-login-help">{adminLabel(language, "loginHelp")}</p>
        <form className="admin-login-form" onSubmit={submit}>
          <label>
            <span>{adminLabel(language, "email")}</span>
            <input name="email" type="email" autoComplete="username" required maxLength={254} />
          </label>
          <label>
            <span>{adminLabel(language, "password")}</span>
            <input name="password" type="password" autoComplete="current-password" required maxLength={256} />
          </label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-primary-button" type="submit" disabled={busy}>
            {busy ? adminLabel(language, "signingIn") : adminLabel(language, "signIn")}
            <span aria-hidden="true">{language === "ar" ? "←" : "→"}</span>
          </button>
        </form>
      </section>
      <p className="admin-login-footer">RED SEA RESORT <span>·</span> OWNER ACCESS</p>
    </main>
  );
}
