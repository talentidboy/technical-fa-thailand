import QRCode from "qrcode";
import { prisma } from "./prisma";
import { getHighestLicense } from "./license-rank";
import { LICENSE_TYPES, labelFor } from "./constants";

export async function getCoachCardData(coachId: number, origin: string) {
  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: { licenseRecords: true },
  });

  if (!coach) return null;

  const highest = getHighestLicense(coach.licenseRecords);
  const licenseLabel = highest
    ? (labelFor(LICENSE_TYPES, highest.licenseType) ?? highest.licenseType)
    : "ไม่มีใบอนุญาต";

  const verifyUrl = `${origin}/verify/${coach.id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#1a3a6b", light: "#ffffff" },
  });

  return { coach, licenseLabel, qrDataUrl, verifyUrl };
}
