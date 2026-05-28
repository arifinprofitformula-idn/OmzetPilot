"use client";

import { useState } from "react";

type AdminActionButtonProps = {
  label: string;
  loadingLabel: string;
  successLabel?: string;
  endpoint: string;
  payload?: Record<string, unknown>;
  variant?: "primary" | "secondary" | "danger";
  onSuccess?: (data: unknown) => void;
};

const variantStyles: Record<NonNullable<AdminActionButtonProps["variant"]>, string> = {
  primary:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  secondary:
    "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
};

export function AdminActionButton({
  label,
  loadingLabel,
  successLabel,
  endpoint,
  payload,
  variant = "secondary",
  onSuccess,
}: AdminActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);

  async function handleClick() {
    try {
      setLoading(true);
      setMessage(null);
      setMessageTone(null);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload ?? {}),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Aksi gagal dijalankan");
      }

      setMessage(successLabel ?? "Aksi selesai dijalankan.");
      setMessageTone("success");
      onSuccess?.(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aksi gagal dijalankan");
      setMessageTone("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${variantStyles[variant]}`}
      >
        {loading ? loadingLabel : label}
      </button>

      {message ? (
        <p
          className={`text-xs leading-5 ${
            messageTone === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
