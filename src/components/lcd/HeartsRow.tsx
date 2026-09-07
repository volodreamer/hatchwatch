import { cn } from "@/lib/utils";

/** P1 hunger/happy heart, 7×6. Same ink for full and empty — hollow vs solid. */
const HEART_ON = [
  ".##.##.",
  "#######",
  "#######",
  ".#####.",
  "..###..",
  "...#...",
];
const HEART_OFF = [
  ".##.##.",
  "#.....#",
  "#.....#",
  ".#...#.",
  "..#.#..",
  "...#...",
];

function Heart({ filled }: { filled: boolean }) {
  const rows = filled ? HEART_ON : HEART_OFF;
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-[18px] w-[21px]"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "#" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function HeartsRow({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-pixel text-sm uppercase text-lcd-pixel/80">{label}</span>
      <div className="flex gap-1" aria-label={`${label} ${value} of 4`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Heart key={i} filled={i < value} />
        ))}
      </div>
    </div>
  );
}

export function DisciplineBar({ value, label = "Disc" }: { value: number; label?: string }) {
  const filled = Math.min(4, Math.round(value / 25));
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-pixel text-sm uppercase text-lcd-pixel/80">{label}</span>
      <div className="flex items-center gap-1.5" aria-label={`Discipline ${value} percent`}>
        <span className="font-pixel text-sm tabular-nums">{value}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-3 w-4 border border-lcd-pixel",
                i < filled ? "bg-lcd-pixel" : "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
