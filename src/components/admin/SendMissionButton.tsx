"use client";

import { AdminActionButton } from "@/src/components/admin/AdminActionButton";

type SendMissionButtonProps = {
  userId: string;
};

export function SendMissionButton({ userId }: SendMissionButtonProps) {
  return (
    <AdminActionButton
      label="Kirim Misi"
      loadingLabel="Mengirim..."
      successLabel="Misi berhasil dikirim ke Telegram."
      endpoint="/api/admin/actions/send-mission"
      payload={{ userId }}
      variant="primary"
    />
  );
}
