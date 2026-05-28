import { StatusBadge } from "@/src/components/admin/StatusBadge";

type MissionStatusBadgeProps = {
  status: string;
};

function getMissionStatusTone(status: string) {
  switch (status) {
    case "reported":
      return "success";
    case "sent":
      return "info";
    case "drafted":
      return "warning";
    case "missed":
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function MissionStatusBadge({ status }: MissionStatusBadgeProps) {
  return (
    <StatusBadge
      label={formatLabel(status)}
      tone={getMissionStatusTone(status)}
    />
  );
}
