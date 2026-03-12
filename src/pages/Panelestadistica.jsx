import { useEffect, useState, useCallback } from "react";
import { getPlatillosVendidos } from "../database/estadisticas";
import { useNavigate } from "react-router-dom";
import logo from "../assets/fondo.png";
import { jsPDF } from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

// ─── Config ────────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: 0, nombre: "Todos", emoji: "📊" },
  { id: 1, nombre: "Tacos", emoji: "🌮" },
  { id: 2, nombre: "Tortas", emoji: "🥪" },
  { id: 3, nombre: "Gorditas", emoji: "🫓" },
  { id: 4, nombre: "Gringas", emoji: "🫔" },
  { id: 5, nombre: "Volcanes", emoji: "🌋" },
  { id: 6, nombre: "Burritos", emoji: "🌯" },
  { id: 7, nombre: "Especiales", emoji: "⭐" },
  { id: 8, nombre: "Bebidas", emoji: "🥤" },
  { id: 9, nombre: "Carnitas", emoji: "🐖" },
];

const VISTAS = [
  { key: "total_cantidad", label: "Piezas", icon: "🍽", color: "#FF6B35" },
  { key: "total_ordenes", label: "Órdenes", icon: "🧾", color: "#06D6A0" },
  { key: "total_ingresos", label: "Ingresos", icon: "💵", color: "#FFD23F" },
];

const COLORS = [
  "#FF6B35",
  "#F7931E",
  "#FFD23F",
  "#06D6A0",
  "#3A86FF",
  "#8338EC",
  "#FB5607",
  "#118AB2",
  "#FF006E",
  "#FFBE0B",
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const hoy = () => new Date().toISOString().split("T")[0];
const hace30 = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};
const fmtFecha = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const medalIcon = (i) => ["🥇", "🥈", "🥉"][i] ?? null;

// ─── Sub-componentes ───────────────────────────────────────────────────────
const KPICard = ({ icon, label, value, color, sub }) => (
  <div
    style={{
      background: "#16162A",
      borderRadius: 16,
      padding: "16px 18px",
      border: `1px solid ${color}33`,
      flex: "1 1 130px",
      borderTop: `3px solid ${color}`,
    }}
  >
    <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
    <div
      style={{
        fontSize: 10,
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 700,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: "#fff",
        marginTop: 3,
        fontFamily: "'Bebas Neue',cursive",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{sub}</div>
    )}
  </div>
);

const AlertRow = ({ item, umbral }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      background: "#1A0E0E",
      borderRadius: 10,
      border: "1px solid #FF006E44",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          {item.nombre}
        </div>
        <div style={{ fontSize: 11, color: "#666" }}>
          {item.total_ordenes} órdenes · {item.total_cantidad} piezas
        </div>
      </div>
    </div>
    <span
      style={{
        background: "#FF006E22",
        color: "#FF006E",
        fontSize: 10,
        fontWeight: 800,
        padding: "4px 10px",
        borderRadius: 99,
        border: "1px solid #FF006E44",
      }}
    >
      BAJO &lt;{umbral}
    </span>
  </div>
);

const RankRow = ({ item, rank, vistaKey, max, color }) => {
  const val = item[vistaKey] ?? 0;
  const pct = Math.round((val / max) * 100);
  const medal = medalIcon(rank);
  const fmt =
    vistaKey === "total_ingresos"
      ? `$${val.toLocaleString()}`
      : val.toLocaleString();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr",
        gap: "0 14px",
        alignItems: "center",
        padding: "11px 14px",
        background: rank === 0 ? "#1E1A10" : "#12121E",
        borderRadius: 12,
        border: `1px solid ${rank === 0 ? "#FFD23F44" : "#ffffff0a"}`,
      }}
    >
      <span style={{ fontSize: 16, textAlign: "center" }}>
        {medal ?? (
          <span style={{ color: "#555", fontSize: 11 }}>#{rank + 1}</span>
        )}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#E8E8E8" }}>
            {item.nombre}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color,
              fontFamily: "'Bebas Neue',cursive",
              letterSpacing: 1,
            }}
          >
            {fmt}
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: "#ffffff0d" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 99,
              background: `linear-gradient(90deg,${color}88,${color})`,
              transition: "width .7s ease",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ fontSize: 10, color: "#555" }}>
            🍽 {item.total_cantidad?.toLocaleString()} pzs
          </span>
          <span style={{ fontSize: 10, color: "#555" }}>
            🧾 {item.total_ordenes} órdenes
          </span>
          <span style={{ fontSize: 10, color: "#555" }}>
            💵 ${item.total_ingresos?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#1C1C2E",
        border: "1px solid #333",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 180,
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontWeight: 700,
          color: "#fff",
          fontSize: 13,
        }}
      >
        {label}
      </p>
      <p style={{ margin: "2px 0", fontSize: 12, color: "#FF6B35" }}>
        🍽 <strong>{d.total_cantidad?.toLocaleString()}</strong> piezas
      </p>
      <p style={{ margin: "2px 0", fontSize: 12, color: "#06D6A0" }}>
        🧾 <strong>{d.total_ordenes?.toLocaleString()}</strong> órdenes
      </p>
      <p style={{ margin: "2px 0", fontSize: 12, color: "#FFD23F" }}>
        💵 <strong>${d.total_ingresos?.toLocaleString()}</strong>
      </p>
    </div>
  );
};

// ─── Panel principal ───────────────────────────────────────────────────────
function PanelEstadisticas() {
  const navigate = useNavigate();
  const [fechaInicio, setFechaInicio] = useState(hace30());
  const [fechaFin, setFechaFin] = useState(hoy());
  const [data, setData] = useState([]);
  const [categoria, setCategoria] = useState(0);
  const [vistaKey, setVistaKey] = useState("total_cantidad");
  const [topN, setTopN] = useState(8);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("grafica");
  const [umbral, setUmbral] = useState(5);
  const [generando, setGenerando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlatillosVendidos(
        categoria,
        0,
        fechaInicio,
        fechaFin,
      );
      setData(res);
    } catch (e) {
      console.error("Error cargando estadísticas:", e);
    } finally {
      setLoading(false);
    }
  }, [categoria, fechaInicio, fechaFin]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const sorted = [...data]
    .sort((a, b) => (b[vistaKey] ?? 0) - (a[vistaKey] ?? 0))
    .slice(0, topN);
  const max = sorted[0]?.[vistaKey] ?? 1;
  const totalPzs = data.reduce((s, d) => s + (d.total_cantidad || 0), 0);
  const totalOrd = data.reduce((s, d) => s + (d.total_ordenes || 0), 0);
  const totalRev = data.reduce((s, d) => s + (d.total_ingresos || 0), 0);
  const estrella = data[0]?.nombre ?? "—";
  const alertas = data.filter((d) => (d.total_cantidad || 0) < umbral);

  // ── Generar PDF del reporte ─────────────────────────────────────────────
  const imprimirTicket = async () => {
    setGenerando(true);
    try {
      const cat = CATEGORIAS.find((c) => c.id === categoria);
      const vista = VISTAS.find((v) => v.key === vistaKey);
      const ahora = new Date().toLocaleString("es-MX");
      const topItems = [...data]
        .sort((a, b) => (b[vistaKey] ?? 0) - (a[vistaKey] ?? 0))
        .slice(0, topN);

      // Altura dinámica
      const alturaBase = 130;
      const alturaItems = topItems.length * 12;
      const alturaTotal = alturaBase + alturaItems;

      const doc = new jsPDF({ unit: "mm", format: [80, alturaTotal] });
      let y = 8;

      // ── Encabezado ────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(0, 0, 0);
      doc.text("TACOS RIVERA", 40, y, { align: "center" });
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("Reporte de Ventas", 40, y, { align: "center" });
      y += 4;
      doc.text(ahora, 40, y, { align: "center" });
      y += 7;

      // ── Línea gruesa ──────────────────────────────────────────────────
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(5, y, 75, y);
      y += 5;

      // ── Período y filtros ─────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text("Período:", 5, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${fmtFecha(fechaInicio)} → ${fmtFecha(fechaFin)}`, 22, y);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.text("Categoría:", 5, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${cat?.nombre ?? "Todos"}`, 25, y);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.text("Vista:", 5, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${vista?.label ?? vistaKey}  ·  Top ${topN}`, 18, y);
      y += 7;

      // ── Línea punteada ────────────────────────────────────────────────
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.setLineWidth(0.35);
      doc.setDrawColor(0, 0, 0);
      doc.line(5, y, 75, y);
      doc.setLineDashPattern([], 0);
      y += 5;

      // ── Título ranking ────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `TOP ${topN} — ${(vista?.label ?? vistaKey).toUpperCase()}`,
        5,
        y,
      );
      y += 6;

      // ── Ítems del ranking ─────────────────────────────────────────────
      topItems.forEach((item, i) => {
        const medal = ["1.", "2.", "3."][i] ?? `${i + 1}.`;
        const nombre =
          item.nombre.length > 22
            ? item.nombre.substring(0, 20) + ".."
            : item.nombre;

        const valor =
          vistaKey === "total_ingresos"
            ? `$${item.total_ingresos?.toLocaleString()}`
            : vistaKey === "total_ordenes"
              ? `${item.total_ordenes} ord`
              : `${item.total_cantidad} pzs`;

        doc.setFont("helvetica", i < 3 ? "bold" : "normal");
        doc.setFontSize(i < 3 ? 10 : 9);
        doc.setTextColor(0, 0, 0);
        doc.text(`${medal} ${nombre}`, 5, y);
        doc.setFont("helvetica", "bold");
        doc.text(valor, 75, y, { align: "right" });
        y += 7;
      });

      // ── Línea gruesa ──────────────────────────────────────────────────
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(5, y, 75, y);
      y += 6;

      // ── Totales globales ──────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("RESUMEN GENERAL", 5, y);
      y += 6;

      const filas = [
        ["Piezas vendidas:", totalPzs.toLocaleString()],
        ["Total órdenes:", totalOrd.toLocaleString()],
        ["Ingresos totales:", `$${totalRev.toLocaleString()}`],
        [
          "Platillo estrella:",
          estrella.length > 18 ? estrella.substring(0, 16) + ".." : estrella,
        ],
      ];

      filas.forEach(([label, valor]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(label, 5, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(valor, 75, y, { align: "right" });
        y += 5.5;
      });

      y += 3;

      // ── Línea punteada final ──────────────────────────────────────────
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.setLineWidth(0.35);
      doc.setDrawColor(0, 0, 0);
      doc.line(5, y, 75, y);
      doc.setLineDashPattern([], 0);
      y += 6;

      // ── Mensaje final ─────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("★ GRACIAS POR SU PREFERENCIA ★", 40, y, { align: "center" });
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("Sistema POS · Tacos Rivera", 40, y, { align: "center" });

      // ── Exportar / Compartir ──────────────────────────────────────────
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      const nombreArchivo = `reporte_${hoy()}.pdf`;

      try {
        const archivo = await Filesystem.writeFile({
          path: nombreArchivo,
          data: pdfBase64,
          directory: Directory.Cache,
        });
        await Share.share({
          title: `Reporte de Ventas ${fmtFecha(fechaInicio)} – ${fmtFecha(fechaFin)}`,
          text: `Reporte · ${vista?.label} · Top ${topN}`,
          url: archivo.uri,
          dialogTitle: "Imprimir o guardar reporte...",
        });
      } catch {
        const blob = doc.output("blob");
        window.open(URL.createObjectURL(blob), "_blank");
      }
    } catch (e) {
      console.error("Error generando reporte PDF:", e);
    } finally {
      setGenerando(false);
    }
  };

  const exportarHTML = () => {
    const rows = sorted
      .map(
        (item, i) => `
      <tr>
        <td>${medalIcon(i) ?? `#${i + 1}`} ${item.nombre}</td>
        <td style="text-align:right">${item.total_cantidad?.toLocaleString()}</td>
        <td style="text-align:right">${item.total_ordenes}</td>
        <td style="text-align:right">$${item.total_ingresos?.toLocaleString()}</td>
      </tr>`,
      )
      .join("");
    const alertRows = alertas
      .map(
        (a) => `
      <tr style="background:#fff3f3">
        <td>⚠️ ${a.nombre}</td>
        <td style="text-align:right;color:#c00">${a.total_cantidad}</td>
        <td style="text-align:right">${a.total_ordenes}</td>
        <td style="text-align:right">$${a.total_ingresos?.toLocaleString()}</td>
      </tr>`,
      )
      .join("");
    const cat = CATEGORIAS.find((c) => c.id === categoria);
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
      <title>Reporte de Ventas — ${fmtFecha(fechaInicio)} al ${fmtFecha(fechaFin)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:32px;color:#111;background:#fff}
        .header{border-bottom:3px solid #FF6B35;padding-bottom:16px;margin-bottom:24px}
        h1{font-size:24px;color:#FF6B35}
        .meta{color:#888;font-size:12px;margin-top:6px}
        .kpis{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
        .kpi{flex:1;min-width:140px;border:1px solid #eee;border-radius:10px;padding:14px 18px;border-top:3px solid #FF6B35}
        .kpi .k-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700}
        .kpi .k-value{font-size:22px;font-weight:800;margin-top:4px}
        h2{font-size:15px;margin-bottom:10px;color:#333}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px}
        th{background:#FF6B35;color:#fff;padding:10px 14px;text-align:left;font-size:12px}
        td{padding:9px 14px;border-bottom:1px solid #f0f0f0}
        tr:nth-child(even) td{background:#fafafa}
        .footer{margin-top:24px;font-size:11px;color:#bbb;border-top:1px solid #eee;padding-top:12px}
        @media print{ body{padding:16px} }
      </style>
    </head><body>
    <div class="header">
      <h1>🌮 Reporte de Ventas</h1>
      <div class="meta">
        Período: <strong>${fmtFecha(fechaInicio)}</strong> al <strong>${fmtFecha(fechaFin)}</strong>
        &nbsp;·&nbsp; Categoría: ${cat?.emoji} ${cat?.nombre}
        &nbsp;·&nbsp; Top ${topN} platillos
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="k-label">🍽 Piezas vendidas</div><div class="k-value">${totalPzs.toLocaleString()}</div></div>
      <div class="kpi" style="border-top-color:#06D6A0"><div class="k-label">🧾 Total órdenes</div><div class="k-value">${totalOrd.toLocaleString()}</div></div>
      <div class="kpi" style="border-top-color:#FFD23F"><div class="k-label">💵 Ingresos</div><div class="k-value">$${totalRev.toLocaleString()}</div></div>
      <div class="kpi" style="border-top-color:#8338EC"><div class="k-label">⭐ Más vendido</div><div class="k-value" style="font-size:14px">${estrella}</div></div>
    </div>
    <h2>📊 Ranking de platillos</h2>
    <table>
      <thead><tr><th>Platillo</th><th style="text-align:right">Piezas</th><th style="text-align:right">Órdenes</th><th style="text-align:right">Ingresos</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${
      alertas.length > 0
        ? `
    <h2>⚠️ Alertas — ventas bajas (menos de ${umbral} piezas)</h2>
    <table>
      <thead><tr><th>Platillo</th><th style="text-align:right">Piezas</th><th style="text-align:right">Órdenes</th><th style="text-align:right">Ingresos</th></tr></thead>
      <tbody>${alertRows}</tbody>
    </table>`
        : ""
    }
    <div class="footer">Generado el ${new Date().toLocaleString("es-MX")} · Sistema POS Taquería</div>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reporte_ventas_${hoy()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const btn = (active, color = "#FF6B35") => ({
    padding: "7px 13px",
    borderRadius: 99,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
    transition: "all .2s",
    background: active ? color : "#1E1E32",
    color: active ? "#000" : "#888",
    boxShadow: active ? `0 0 12px ${color}55` : "none",
    opacity: generando ? 0.6 : 1,
  });

  const inputStyle = {
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid #2a2a3a",
    background: "#1A1A2E",
    color: "#ccc",
    fontSize: 12,
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#0D0D1A",
        fontFamily: "'Outfit','Segoe UI',sans-serif",
        color: "#E8E8E8",
        padding: "20px 16px",
        boxSizing: "border-box",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Bebas+Neue&display=swap"
        rel="stylesheet"
      />

      {/* ── OVERLAY GENERANDO ─────────────────────────────────────────── */}
      {generando && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1C1C2E",
              borderRadius: 16,
              padding: "28px 36px",
              textAlign: "center",
              border: "1px solid #333",
            }}
          >
            <div
              style={{
                fontSize: 40,
                marginBottom: 10,
                animation: "spin 1s linear infinite",
              }}
            >
              🖨️
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              Generando reporte…
            </div>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <img src={logo} alt="taco" width="100" height="100" />
          <button className="pd-btn-back" onClick={() => navigate("/")}>
            ← Regresar
          </button>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#FF6B35",
              textTransform: "uppercase",
            }}
          >
            Panel de Control
          </p>
          <h2
            style={{
              margin: "2px 0 0",
              fontSize: 22,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            Estadísticas de Ventas
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={cargar} style={btn(false, "#3A86FF")}>
            🔄 Actualizar
          </button>
          <button
            onClick={imprimirTicket}
            disabled={generando}
            style={btn(false, "#06D6A0")}
          >
            {generando ? "⏳ Generando…" : "🖨 Ticket PDF"}
          </button>
          <button onClick={exportarHTML} style={btn(false, "#FFD23F")}>
            📄 Exportar HTML
          </button>
        </div>
      </div>

      {/* ── RANGO DE FECHAS ──────────────────────────────────────────── */}
      <div
        style={{
          background: "#12121E",
          borderRadius: 14,
          padding: "14px 16px",
          border: "1px solid #1E1E32",
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "flex-end",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              color: "#888",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 5,
            }}
          >
            Fecha inicio
          </div>
          <input
            type="date"
            value={fechaInicio}
            max={fechaFin}
            onChange={(e) => setFechaInicio(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ color: "#444", alignSelf: "center", paddingTop: 14 }}>
          →
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              color: "#888",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 5,
            }}
          >
            Fecha fin
          </div>
          <input
            type="date"
            value={fechaFin}
            min={fechaInicio}
            max={hoy()}
            onChange={(e) => setFechaFin(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignSelf: "flex-end",
          }}
        >
          {[
            {
              label: "Hoy",
              fn: () => {
                setFechaInicio(hoy());
                setFechaFin(hoy());
              },
            },
            {
              label: "7 días",
              fn: () => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setFechaInicio(d.toISOString().split("T")[0]);
                setFechaFin(hoy());
              },
            },
            {
              label: "30 días",
              fn: () => {
                setFechaInicio(hace30());
                setFechaFin(hoy());
              },
            },
            {
              label: "Este mes",
              fn: () => {
                const d = new Date();
                setFechaInicio(
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
                );
                setFechaFin(hoy());
              },
            },
          ].map((f) => (
            <button
              key={f.label}
              onClick={f.fn}
              style={{
                padding: "5px 10px",
                borderRadius: 99,
                border: "1px solid #2a2a3a",
                background: "#1A1A2E",
                color: "#777",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div
          style={{
            marginLeft: "auto",
            alignSelf: "center",
            fontSize: 12,
            color: "#555",
            paddingTop: 14,
          }}
        >
          {fmtFecha(fechaInicio)} → {fmtFecha(fechaFin)}
        </div>
      </div>

      {/* ── CATEGORÍAS ───────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}
      >
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoria(c.id)}
            style={btn(categoria === c.id, "#FF6B35")}
          >
            {c.emoji} {c.nombre}
          </button>
        ))}
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 18 }}
      >
        <KPICard
          icon="🍽"
          label="Piezas vendidas"
          value={totalPzs.toLocaleString()}
          color="#FF6B35"
          sub="unidades totales"
        />
        <KPICard
          icon="🧾"
          label="Total órdenes"
          value={totalOrd.toLocaleString()}
          color="#06D6A0"
          sub="pedidos procesados"
        />
        <KPICard
          icon="💵"
          label="Ingresos"
          value={`$${totalRev.toLocaleString()}`}
          color="#FFD23F"
          sub="en ventas"
        />
        <KPICard
          icon="⭐"
          label="Más vendido"
          value={estrella}
          color="#8338EC"
          sub="platillo estrella"
        />
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {VISTAS.map((v) => (
          <button
            key={v.key}
            onClick={() => setVistaKey(v.key)}
            style={btn(vistaKey === v.key, v.color)}
          >
            {v.icon} {v.label}
          </button>
        ))}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "grafica", label: "📊 Gráfica" },
            { id: "ranking", label: "🏆 Ranking" },
            {
              id: "alertas",
              label: `⚠️ Alertas${alertas.length > 0 ? ` (${alertas.length})` : ""}`,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={btn(
                tab === t.id,
                t.id === "alertas" && alertas.length > 0
                  ? "#FF006E"
                  : "#3A86FF",
              )}
            >
              {t.label}
            </button>
          ))}
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            style={{ ...inputStyle, fontWeight: 700, cursor: "pointer" }}
          >
            {[5, 8, 10, 15].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#444" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 14 }}>Cargando datos…</p>
        </div>
      ) : tab === "alertas" ? (
        <div>
          <div
            style={{
              background: "#12121E",
              borderRadius: 12,
              padding: "12px 16px",
              border: "1px solid #1E1E32",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12, color: "#888" }}>Umbral mínimo:</span>
            <input
              type="number"
              min={1}
              max={999}
              value={umbral}
              onChange={(e) => setUmbral(Number(e.target.value))}
              style={{ ...inputStyle, width: 64, textAlign: "center" }}
            />
            <span style={{ fontSize: 12, color: "#555" }}>
              Platillos con menos de{" "}
              <strong style={{ color: "#FF006E" }}>{umbral}</strong> piezas en
              el período
            </span>
          </div>
          {alertas.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <p>Sin alertas — todos los platillos superan {umbral} piezas</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p
                style={{
                  fontSize: 12,
                  color: "#FF006E",
                  margin: "0 0 8px",
                  fontWeight: 700,
                }}
              >
                ⚠️ {alertas.length} platillo{alertas.length !== 1 ? "s" : ""}{" "}
                con ventas bajas:
              </p>
              {alertas.map((item) => (
                <AlertRow key={item.nombre} item={item} umbral={umbral} />
              ))}
            </div>
          )}
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#444" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍽</div>
          <p style={{ fontSize: 14 }}>Sin ventas en el período seleccionado</p>
        </div>
      ) : tab === "grafica" ? (
        <div
          style={{
            background: "#12121E",
            borderRadius: 18,
            padding: "20px 8px 12px",
            border: "1px solid #1E1E32",
          }}
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={sorted}
              margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E32" />
              <XAxis
                dataKey="nombre"
                tick={{ fill: "#666", fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: "#555", fontSize: 11 }} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#ffffff07" }}
              />
              <Bar dataKey={vistaKey} radius={[6, 6, 0, 0]} maxBarSize={52}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((item, i) => (
            <RankRow
              key={item.nombre}
              item={item}
              rank={i}
              vistaKey={vistaKey}
              max={max}
              color={COLORS[i % COLORS.length]}
            />
          ))}
        </div>
      )}

      <p
        style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 11,
          color: "#2a2a3a",
        }}
      >
        {data.length} platillos · {fmtFecha(fechaInicio)} → {fmtFecha(fechaFin)}
      </p>
    </div>
  );
}

export default PanelEstadisticas;
