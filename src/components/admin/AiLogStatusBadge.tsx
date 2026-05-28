import { StatusBadge } from "@/src/components/admin/StatusBadge";
import { getFriendlyLabel } from "@/src/lib/uiLanguage";

type AiLogStatusBadgeProps = {
  status: string;
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getTone(status: string) {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function AiLogStatusBadge({ status }: AiLogStatusBadgeProps) {
  const label =
    status === "success"
      ? "Berhasil"
      : status === "failed"
        ? "Perlu Dicek"
        : getFriendlyLabel(formatLabel(status));

  return <StatusBadge label={label} tone={getTone(status)} />;
}
