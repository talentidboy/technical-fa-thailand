import { Waves, Fish, TreePalm, Mountain, Landmark, Compass, Droplets, Moon, Star, Volleyball } from "lucide-react";
import type { PassportIconName } from "@/lib/play-and-learn";

const ICONS = {
  waves: Waves,
  fish: Fish,
  palm: TreePalm,
  mountain: Mountain,
  temple: Landmark,
  compass: Compass,
  droplets: Droplets,
  moon: Moon,
  star: Star,
  ball: Volleyball,
} satisfies Record<PassportIconName, unknown>;

// ไอคอนประจำบทพาสปอร์ต — ชื่อที่ไม่รู้จักใช้รูปดาวแทน
export function PassportIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = ICONS[(name ?? "") as PassportIconName] ?? Star;
  return <Icon className={className} />;
}
