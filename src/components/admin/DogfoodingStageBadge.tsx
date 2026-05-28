import { StatusBadge } from "@/src/components/admin/StatusBadge";

type DogfoodingStageBadgeProps = {
  label: string;
  tone?: "success" | "warning" | "danger" | "muted" | "info" | "neutral";
};

export function DogfoodingStageBadge({
  label,
  tone = "neutral",
}: DogfoodingStageBadgeProps) {
  return <StatusBadge label={label} tone={tone} />;
}
