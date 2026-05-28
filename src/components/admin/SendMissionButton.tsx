"use client";

import { AdminActionButton } from "@/src/components/admin/AdminActionButton";

type SendMissionButtonProps = {
  userId: string;
};

export function SendMissionButton({ userId }: SendMissionButtonProps) {
  return (
    <AdminActionButton
      label="Send Mission"
      loadingLabel="Sending..."
      successLabel="Mission sent to Telegram."
      endpoint="/api/admin/actions/send-mission"
      payload={{ userId }}
      variant="primary"
    />
  );
}
