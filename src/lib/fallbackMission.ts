import { type MissionGenerationInput, type MissionGenerationItem } from "@/src/lib/missionTypes";

function getProductLabel(input: MissionGenerationInput) {
  return input.productName.trim() || "produk utama";
}

function getOfferLabel(input: MissionGenerationInput) {
  return input.currentOffer?.trim() || `${getProductLabel(input)} yang paling mudah dijelaskan`;
}

export function getFallbackMission(
  input: MissionGenerationInput
): MissionGenerationItem[] {
  const productLabel = getProductLabel(input);
  const offerLabel = getOfferLabel(input);

  return [
    {
      mission_type: "follow_up",
      mission_order: 1,
      target_description:
        "Hubungi 3 orang yang pernah tanya, pernah balas story, atau pernah simpan kontak jualanmu.",
      action_instruction: `Kirim follow-up singkat ke 3 orang yang paling hangat. Tanyakan apakah mereka masih butuh ${productLabel} dan ajak lanjut chat tanpa memaksa.`,
      script_text: `Halo Kak, izin follow up ya. Beberapa waktu lalu Kakak sempat tertarik dengan ${productLabel}. Kalau masih relevan, aku bisa bantu jelaskan singkat dan kasih pilihan yang paling cocok.`,
      target_minimum: "3 chat follow-up terkirim",
    },
    {
      mission_type: "offer",
      mission_order: 2,
      target_description:
        "Tawarkan 1 penawaran sederhana yang mudah dipahami ke calon pembeli yang paling responsif hari ini.",
      action_instruction: `Pilih maksimal 2 calon pembeli yang paling mungkin merespons, lalu kirim penawaran ${offerLabel} dengan bahasa singkat, jelas, dan fokus manfaat.`,
      script_text: `Kak, kalau Kakak lagi cari solusi yang praktis, aku ada ${offerLabel}. Cocok untuk yang butuh hasil cepat tanpa proses ribet. Kalau mau, aku kirim ringkasan manfaat dan harganya ya.`,
      target_minimum: "2 penawaran ringan terkirim",
    },
    {
      mission_type: "content_traffic",
      mission_order: 3,
      target_description:
        "Buat 1 konten ringan yang mengajak orang masuk ke chat untuk tanya lebih lanjut.",
      action_instruction: `Posting 1 story atau status yang menunjukkan manfaat utama ${productLabel}, lalu tutup dengan ajakan balas chat atau reply agar percakapan masuk.`,
      script_text: `Hari ini lagi bantu beberapa orang yang butuh ${productLabel}. Kalau kamu mau tahu cara pakainya, kisaran harga, atau cocok tidak untuk kebutuhanmu, balas chat ini ya.`,
      target_minimum: "1 story/status tayang dengan CTA ke chat",
    },
  ];
}
