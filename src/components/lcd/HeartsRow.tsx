/** P1 LCD glyphs — same ink for on/off, hollow vs solid. */

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
  "#..#..#",
  "#.....#",
  ".#...#.",
  "..#.#..",
  "...#...",
];

const BAR_ON = [
  "########",
  "########",
  "########",
  "########",
  "########",
];
const BAR_OFF = [
  "########",
  "#......#",
  "#......#",
  "#......#",
  "########",
];

function PixelGlyph({
  rows,
  className,
}: {
  rows: string[];
  className: string;
}) {
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null,
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
          <PixelGlyph key={i} rows={i < value ? HEART_ON : HEART_OFF} className="h-[22px] w-[26px]" />
        ))}
      </div>
    </div>
  );
}

export function DisciplineBar({ value, label = "Disc" }: { value: number; label?: string }) {
  const filled = Math.min(4, Math.floor(value / 25));
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-pixel text-sm uppercase text-lcd-pixel/80">{label}</span>
      <div className="flex items-center gap-0.5" aria-label={`Discipline ${value} percent`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <PixelGlyph
            key={i}
            rows={i < filled ? BAR_ON : BAR_OFF}
            className="h-[14px] w-[22px]"
          />
        ))}
      </div>
    </div>
  );
}
