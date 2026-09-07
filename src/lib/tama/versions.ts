import type { Firmware } from "./types";

/** UI versions. Engine still uses vintage | replica. Later: G2, Connection, Paradise. */
export const TAMA_VERSIONS: { id: Firmware; label: string }[] = [
  { id: "vintage", label: "ver.g1" },
  { id: "replica", label: "ver.g1a" },
];
