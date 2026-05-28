import { StatusBadge } from "@/src/components/admin/StatusBadge";
import {
  getOfferTypeLabel,
  getPaymentActionLabel,
} from "@/src/lib/uiLanguage";

type PaymentStatusBadgeProps = {
  kind: "payment_action" | "offer_type" | "verbal_intent";
  value: string | null;
};

function getLabel(kind: PaymentStatusBadgeProps["kind"], value: string | null) {
  if (!value) {
    return "-";
  }

  if (kind === "payment_action") {
    switch (value) {
      case "paid":
        return getPaymentActionLabel("paid");
      case "pending":
        return getPaymentActionLabel("pending");
      case "no":
        return getPaymentActionLabel("no");
      case "not_offered":
        return getPaymentActionLabel("not_offered");
      default:
        return value.replaceAll("_", " ");
    }
  }

  if (kind === "offer_type") {
    switch (value) {
      case "founder_trial_extension":
        return getOfferTypeLabel("founder_trial_extension");
      case "founder_plan":
        return getOfferTypeLabel("founder_plan");
      default:
        return value.replaceAll("_", " ");
    }
  }

  if (kind === "verbal_intent") {
    switch (value) {
      case "yes":
        return "Tertarik";
      case "maybe":
        return "Masih Pertimbangkan";
      case "no":
        return "Belum Berminat";
      default:
        return value.replaceAll("_", " ");
    }
  }

  return value;
}

function getTone(kind: PaymentStatusBadgeProps["kind"], value: string | null) {
  if (!value) {
    return "muted";
  }

  if (kind === "payment_action") {
    switch (value) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "no":
        return "danger";
      case "not_offered":
        return "muted";
      default:
        return "neutral";
    }
  }

  if (kind === "offer_type") {
    switch (value) {
      case "founder_plan":
        return "info";
      case "founder_trial_extension":
        return "warning";
      default:
        return "neutral";
    }
  }

  if (kind === "verbal_intent") {
    switch (value) {
      case "yes":
        return "success";
      case "maybe":
        return "warning";
      case "no":
        return "danger";
      default:
        return "neutral";
    }
  }

  return "neutral";
}

export function PaymentStatusBadge({
  kind,
  value,
}: PaymentStatusBadgeProps) {
  return <StatusBadge label={getLabel(kind, value)} tone={getTone(kind, value)} />;
}
