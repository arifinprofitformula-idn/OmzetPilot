import { StatusBadge } from "@/src/components/admin/StatusBadge";
import { getMissionStatusLabel } from "@/src/lib/uiLanguage";

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

export function MissionStatusBadge({ status }: MissionStatusBadgeProps) {
  return (
    <StatusBadge
      label={getMissionStatusLabel(status)}
      tone={getMissionStatusTone(status)}
    />
  );
}
