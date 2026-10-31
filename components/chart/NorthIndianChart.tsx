import { northGeometry } from "@/lib/chart/geometry";
import { DIVISION_LABELS, type ChartView } from "@/lib/chart/view";
import { ChartSvg } from "./ChartSvg";

/** North Indian chart: house 1 at top centre, houses anticlockwise, sign numbers in each house. */
export function NorthIndianChart({ view, standalone }: { view: ChartView; standalone?: boolean }) {
  return <ChartSvg geometry={northGeometry(view)} title={`North Indian ${DIVISION_LABELS[view.division]} chart`} standalone={standalone} />;
}
