import { southGeometry } from "@/lib/chart/geometry";
import { DIVISION_LABELS, type ChartView } from "@/lib/chart/view";
import { ChartSvg } from "./ChartSvg";

/** South Indian chart: fixed sign grid with the Lagna cell marked. */
export function SouthIndianChart({ view, standalone }: { view: ChartView; standalone?: boolean }) {
  return <ChartSvg geometry={southGeometry(view)} title={`South Indian ${DIVISION_LABELS[view.division]} chart`} standalone={standalone} />;
}
