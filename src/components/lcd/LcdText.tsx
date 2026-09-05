import { glyphFor } from "@/lib/tama/lcd-font";
import { cn } from "@/lib/utils";

export function LcdText({
  text,
  className,
  pixel = 2,
}: {
  text: string;
  className?: string;
  pixel?: number;
}) {
  const chars = [...text];
  return (
    <span className={cn("inline-flex items-end gap-0.5", className)} aria-label={text}>
      {chars.map((ch, i) => {
        const rows = glyphFor(ch);
        const w = rows[0]?.length ?? 3;
        const h = rows.length;
        return (
          <svg
            key={`${ch}-${i}`}
            viewBox={`0 0 ${w} ${h}`}
            width={w * pixel}
            height={h * pixel}
            shapeRendering="crispEdges"
            aria-hidden
            className="block"
          >
            {rows.flatMap((row, y) =>
              [...row].map((c, x) =>
                c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null,
              ),
            )}
          </svg>
        );
      })}
    </span>
  );
}
