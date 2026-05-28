import { StatusBadge } from "@/src/components/admin/StatusBadge";
import type { QaStatus } from "@/src/lib/adminQa";

type QaStatusBadgeProps = {
  status: QaStatus;
};

const labelMap: Record<QaStatus, string> = {
  pass: "Pass",
  warning: "Warning",
  fail: "Fail",
  not_tested: "Not Tested",
};

const toneMap: Record<
  QaStatus,
  "success" | "warning" | "danger" | "muted"
> = {
  pass: "success",
  warning: "warning",
  fail: "danger",
  not_tested: "muted",
};

export function QaStatusBadge({ status }: QaStatusBadgeProps) {
  return <StatusBadge label={labelMap[status]} tone={toneMap[status]} />;
}
