"use client";

import { useState } from "react";

import { AdminActionButton } from "@/src/components/admin/AdminActionButton";

type GenerateMagicLinkButtonProps = {
  userId: string;
};

export function GenerateMagicLinkButton({
  userId,
}: GenerateMagicLinkButtonProps) {
  const [magicLink, setMagicLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!magicLink) {
      return;
    }

    await navigator.clipboard.writeText(magicLink);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <div className="space-y-2">
      <AdminActionButton
        label="Generate Magic Link"
        loadingLabel="Generating..."
        successLabel="Magic link generated."
        endpoint="/api/admin/actions/generate-magic-link"
        payload={{ userId }}
        variant="secondary"
        onSuccess={(data) => {
          const payload = data as { magicLink?: string };
          setMagicLink(payload.magicLink ?? "");
          setCopied(false);
        }}
      />

      {magicLink ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            readOnly
            value={magicLink}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
