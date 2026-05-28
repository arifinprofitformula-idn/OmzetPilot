import { StatusBadge } from "@/src/components/admin/StatusBadge";

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
  return <StatusBadge label={formatLabel(status)} tone={getTone(status)} />;
}
