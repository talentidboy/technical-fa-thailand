import { REGION_STYLE, DEFAULT_REGION_STYLE, parseRegionGroup } from "@/lib/g15-region";

const SIZE_CLASSES = {
  sm: { box: "h-6 w-6", text: "text-[10px]" },
  md: { box: "h-8 w-8", text: "text-xs" },
  lg: { box: "h-16 w-16 sm:h-20 sm:w-20", text: "text-2xl" },
} as const;

export function TeamBadge({
  team,
  size = "md",
}: {
  team: { name: string; logoUrl: string | null; groupName: string | null };
  size?: keyof typeof SIZE_CLASSES;
}) {
  const parsed = parseRegionGroup(team.groupName);
  const style = (parsed && REGION_STYLE[parsed.region]) ?? DEFAULT_REGION_STYLE;
  const { box, text } = SIZE_CLASSES[size];

  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={team.logoUrl} alt="" className={`${box} flex-none rounded-full object-cover ring-1 ring-slate-200`} />
    );
  }
  return (
    <span className={`flex ${box} flex-none items-center justify-center rounded-full ${text} font-bold text-white ${style.bg}`}>
      {team.name.charAt(0)}
    </span>
  );
}
