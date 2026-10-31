import { Document, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ChartData } from "@/lib/astro/chart";
import { PLANETS } from "@/lib/astro/tables/planets";
import { SIGNS } from "@/lib/astro/tables/signs";
import { chartGeometry, type ChartGeometry } from "@/lib/chart/geometry";
import { availableDivisions, chartView, DIVISION_LABELS, type ChartStyle } from "@/lib/chart/view";

const C = { paper: "#F6EEDC", ink: "#5B3A12", label: "#7A5A2E", planet: "#2A1A05", muted: "#6B6680", text: "#1F1B33" };

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: C.text, fontFamily: "Helvetica" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  muted: { color: C.muted },
  charts: { flexDirection: "row", gap: 16, marginTop: 8 },
  chartBox: { width: 250, padding: 8, backgroundColor: C.paper, borderRadius: 8 },
  chartCaption: { fontSize: 9, color: C.ink, marginTop: 4, textAlign: "center" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#D8D3E8", paddingVertical: 3 },
  head: { fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: C.muted },
});

/** Same geometry as the on-screen chart, drawn with react-pdf primitives. */
function PdfChart({ g }: { g: ChartGeometry }) {
  return (
    <Svg viewBox="0 0 300 300" width={234} height={234}>
      {g.paths.map((d, i) => (
        <Path key={i} d={d} stroke={C.ink} strokeWidth={i === 0 ? 2 : 1.5} fill="none" />
      ))}
      {g.texts.map((t, i) => (
        <Text
          key={i}
          x={t.role === "label" && t.text.length === 3 ? t.x : t.x}
          y={t.y + t.size * 0.35}
          textAnchor={t.role === "label" && t.text.length === 3 ? "start" : "middle"}
          style={{
            fontSize: t.size,
            fontFamily: t.bold ? "Helvetica-Bold" : "Helvetica",
            fill: t.role === "label" ? C.label : t.role === "asc" ? C.ink : C.planet,
          }}
        >
          {t.text}
        </Text>
      ))}
    </Svg>
  );
}

const dms = (deg: number) => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
};
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const year = (iso: string) => iso.slice(0, 4);

export interface KundaliPdfProps {
  name: string;
  birthLine: string;
  zoneLine: string;
  chart: ChartData;
  style: ChartStyle;
}

export function KundaliPdf({ name, birthLine, zoneLine, chart, style }: KundaliPdfProps) {
  const divisions = availableDivisions(chart).filter((d) => d !== "moon" || !chart.lagna);
  const cols = chart.lagna ? [110, 90, 70, 150, 60] : [110, 90, 70, 150];

  return (
    <Document title={`Kundali – ${name}`} author="Jyotish" creator="Jyotish">
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Kundali – {name}</Text>
        <Text>{birthLine}</Text>
        <Text style={s.muted}>
          {zoneLine} · Lahiri ayanamsa {dms(chart.ayanamsa.degrees)} · whole-sign houses
        </Text>
        {!chart.timeKnown ? (
          <Text style={{ marginTop: 6, color: C.ink }}>
            Birth time is missing, so Lagna, houses and Navamsa are not shown. Moon sign, nakshatra and dasha are approximate.
          </Text>
        ) : null}

        <View style={s.charts}>
          {divisions.map((d) => {
            const view = chartView(chart, d)!;
            return (
              <View key={d} style={s.chartBox}>
                <PdfChart g={chartGeometry(view, style)} />
                <Text style={s.chartCaption}>{DIVISION_LABELS[d]}</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.h2}>Planet positions</Text>
        <View style={[s.row, s.head]}>
          {["Planet", "Sign", "Degree", "Nakshatra", ...(chart.lagna ? ["House"] : [])].map((h, i) => (
            <Text key={h} style={{ width: cols[i] }}>
              {h}
            </Text>
          ))}
        </View>
        {chart.lagna ? (
          <View style={s.row}>
            <Text style={{ width: cols[0] }}>Lagna</Text>
            <Text style={{ width: cols[1] }}>{SIGNS[chart.lagna.sign]!.en}</Text>
            <Text style={{ width: cols[2] }}>{dms(chart.lagna.degreeInSign)}</Text>
            <Text style={{ width: cols[3] }}>
              {chart.lagna.nakshatra.name} ({chart.lagna.nakshatra.pada})
            </Text>
            <Text style={{ width: cols[4] }}>1st</Text>
          </View>
        ) : null}
        {PLANETS.map((p) => {
          const d = chart.planets[p];
          return (
            <View key={p} style={s.row}>
              <Text style={{ width: cols[0] }}>
                {p}
                {d.retrograde && p !== "Rahu" && p !== "Ketu" ? " (R)" : ""}
              </Text>
              <Text style={{ width: cols[1] }}>{SIGNS[d.sign]!.en}</Text>
              <Text style={{ width: cols[2] }}>{dms(d.degreeInSign)}</Text>
              <Text style={{ width: cols[3] }}>
                {d.nakshatra.name} ({d.nakshatra.pada})
              </Text>
              {d.house ? <Text style={{ width: cols[4] }}>{ordinal(d.house)}</Text> : null}
            </View>
          );
        })}

        <Text style={s.h2}>Vimshottari dasha</Text>
        {chart.dasha.mahadashas.map((m) => (
          <View key={m.start} style={s.row}>
            <Text style={{ width: 110 }}>{m.lord}</Text>
            <Text>
              {year(m.start)} – {year(m.end)}
            </Text>
          </View>
        ))}

        <Text style={s.footer} fixed>
          For guidance and entertainment. Not a substitute for professional advice. · Generated by Jyotish
        </Text>
      </Page>
    </Document>
  );
}
