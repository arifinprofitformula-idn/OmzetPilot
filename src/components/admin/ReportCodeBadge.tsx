import { StatusBadge } from "@/src/components/admin/StatusBadge";
import { getReportCodeLabel as getFriendlyReportCodeLabel } from "@/src/lib/uiLanguage";

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
      return `1 • ${getFriendlyReportCodeLabel("1")}`;
    case "2":
      return `2 • ${getFriendlyReportCodeLabel("2")}`;
    case "3":
      return `3 • ${getFriendlyReportCodeLabel("3")}`;
    case "4":
      return `4 • ${getFriendlyReportCodeLabel("4")}`;
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
