import { StatusBadge } from "@/src/components/admin/StatusBadge";

type ReportCodeBadgeProps = {
  reportCode: string | null;
};

function getReportCodeTone(reportCode: string | null) {
  switch (reportCode) {
    case "1":
      return "success";
    case "2":
      return "info";
    case "3":
      return "warning";
    case "4":
      return "danger";
    default:
      return "muted";
  }
}

function getReportCodeLabel(reportCode: string | null) {
  switch (reportCode) {
    case "1":
      return "1 Closing";
    case "2":
      return "2 Progress";
    case "3":
      return "3 Follow Up";
    case "4":
      return "4 Blocked";
    default:
      return "-";
  }
}

export function ReportCodeBadge({ reportCode }: ReportCodeBadgeProps) {
  return (
    <StatusBadge
      label={getReportCodeLabel(reportCode)}
      tone={getReportCodeTone(reportCode)}
    />
  );
}
