import { useEffect, useState, useMemo } from "react";
import { getDB, isWeb } from "../database/database";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700;900&display=swap');

  :root {
    --rojo: #C0392B;
    --rojo-oscuro: #922B21;
    --naranja: #E67E22;
    --naranja-claro: #F39C12;
    --crema: #FDF6EC;
    --crema-oscuro: #F0DDB8;
    --marron: #6E2C0E;
    --marron-claro: #A04000;
    --texto-oscuro: #2C1810;
    --texto-medio: #5D4037;
    --blanco: #FFFDF9;
    --verde: #1E6B3C;
    --verde-claro: #27AE60;
    --morado: #4A235A;
    --morado-claro: #8E44AD;
  }

  * { box-sizing: border-box; }

  .vi-app {
    font-family: 'Lato', sans-serif;
    min-height: 100vh;
    background-color: var(--crema);
    background-image:
      radial-gradient(ellipse at top left, rgba(192,57,43,0.06) 0%, transparent 55%),
      radial-gradient(ellipse at bottom right, rgba(230,126,34,0.08) 0%, transparent 55%);
  }

  /* ═══════════════════════════════
     HEADER
  ═══════════════════════════════ */
  .vi-header {
    background: linear-gradient(135deg, var(--verde) 0%, #1a5c35 50%, var(--verde-claro) 100%);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(30,107,60,0.4);
    position: sticky;
    top: 0;
    z-index: 100;
    overflow: hidden;
  }

  .vi-header::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 150px; height: 150px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    pointer-events: none;
  }

  .vi-header::after {
    content: '';
    position: absolute;
    bottom: -30px; left: 25%;
    width: 100px; height: 100px;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
    pointer-events: none;
  }

  .vi-header-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(14px, 4vw, 20px);
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 8px rgba(0,0,0,0.3);
    position: relative;
    text-align: center;
    flex: 1;
  }

  .vi-header-title span { color: #a8e6c0; }

  .vi-btn-back {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.22);
    color: #fff;
    padding: 7px 14px;
    border-radius: 20px;
    font-size: clamp(11px, 3vw, 13px);
    cursor: pointer;
    font-family: 'Lato', sans-serif;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
    position: relative;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .vi-btn-back:hover { background: rgba(255,255,255,0.22); }

  .vi-header-spacer {
    width: 90px;
    flex-shrink: 0;
  }

  /* ═══════════════════════════════
     BODY
  ═══════════════════════════════ */
  .vi-body {
    padding: clamp(12px, 4vw, 24px);
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
  }

  /* ═══════════════════════════════
     STATS GRID
  ═══════════════════════════════ */
  .vi-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(10px, 2.5vw, 14px);
    margin-bottom: 22px;
  }

  /* Tablet: 2 col, primer card ancho completo */
  @media (max-width: 600px) {
    .vi-stats-grid {
      grid-template-columns: 1fr 1fr;
    }
    .vi-stat-card:first-child {
      grid-column: 1 / -1;
    }
  }

  /* Phones pequeños: todas las cards en 1 col */
  @media (max-width: 340px) {
    .vi-stats-grid { grid-template-columns: 1fr; }
    .vi-stat-card:first-child { grid-column: auto; }
  }

  .vi-stat-card {
    border-radius: 14px;
    padding: clamp(12px, 3vw, 18px) clamp(12px, 3vw, 20px);
    display: flex;
    align-items: center;
    gap: clamp(10px, 2.5vw, 14px);
    box-shadow: 0 3px 16px rgba(0,0,0,0.12);
    position: relative;
    overflow: hidden;
    min-width: 0;
  }

  .vi-stat-card::after {
    content: '';
    position: absolute;
    top: -20px; right: -20px;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    pointer-events: none;
  }

  .vi-stat-total  { background: linear-gradient(135deg, var(--verde) 0%, var(--verde-claro) 100%); }
  .vi-stat-count  { background: linear-gradient(135deg, var(--marron) 0%, var(--marron-claro) 100%); }
  .vi-stat-avg    { background: linear-gradient(135deg, var(--morado) 0%, var(--morado-claro) 100%); }

  .vi-stat-icon {
    font-size: clamp(22px, 5vw, 28px);
    flex-shrink: 0;
  }

  .vi-stat-info { min-width: 0; }

  .vi-stat-label {
    font-size: clamp(9px, 2.2vw, 10px);
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.72);
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .vi-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: clamp(16px, 4vw, 22px);
    font-weight: 900;
    color: white;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ═══════════════════════════════
     SECTION LABEL
  ═══════════════════════════════ */
  .vi-section-label {
    font-size: clamp(9px, 2.5vw, 11px);
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--marron);
    opacity: 0.6;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .vi-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--crema-oscuro), transparent);
  }

  /* ═══════════════════════════════
     GRÁFICA
  ═══════════════════════════════ */
  .vi-chart-card {
    background: var(--blanco);
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(110,44,14,0.09);
    border: 1px solid rgba(230,126,34,0.12);
    overflow: hidden;
    margin-bottom: 24px;
  }

  .vi-chart-header {
    background: linear-gradient(135deg, var(--naranja) 0%, var(--naranja-claro) 100%);
    padding: clamp(10px, 2.5vw, 14px) clamp(12px, 3vw, 20px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .vi-chart-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(13px, 3.5vw, 16px);
    font-weight: 700;
    color: white;
  }

  .vi-chart-tabs {
    display: flex;
    gap: 6px;
  }

  .vi-chart-tab {
    padding: 5px 12px;
    border-radius: 14px;
    font-size: clamp(11px, 2.8vw, 12px);
    font-weight: 700;
    cursor: pointer;
    font-family: 'Lato', sans-serif;
    border: none;
    transition: all 0.2s;
    background: rgba(255,255,255,0.2);
    color: white;
  }

  .vi-chart-tab.active {
    background: white;
    color: var(--naranja);
  }

  .vi-chart-body {
    padding: clamp(12px, 3vw, 20px);
    overflow-x: auto;   /* allows scrolling on very narrow screens */
  }

  /* ─── BARRAS ─── */
  .vi-bars-container {
    display: flex;
    align-items: flex-end;
    gap: clamp(4px, 1.5vw, 8px);
    height: clamp(120px, 25vw, 160px);
    padding-bottom: 28px;
    position: relative;
    min-width: 200px;   /* prevent bars from collapsing */
  }

  .vi-bars-container::after {
    content: '';
    position: absolute;
    bottom: 28px; left: 0; right: 0;
    height: 1px;
    background: var(--crema-oscuro);
  }

  .vi-bar-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    height: 100%;
    position: relative;
    cursor: default;
    min-width: 0;
  }

  .vi-bar {
    width: 100%;
    border-radius: 6px 6px 0 0;
    background: linear-gradient(to top, var(--naranja), var(--naranja-claro));
    transition: all 0.4s ease;
    position: relative;
    min-height: 4px;
  }

  .vi-bar:hover { filter: brightness(1.1); }

  .vi-bar-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--texto-oscuro);
    color: white;
    font-size: clamp(9px, 2.5vw, 11px);
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 10;
  }

  .vi-bar-wrap:hover .vi-bar-tooltip { opacity: 1; }

  .vi-bar-label {
    position: absolute;
    bottom: 6px;
    font-size: clamp(8px, 2vw, 10px);
    font-weight: 700;
    color: var(--texto-medio);
    text-align: center;
    width: 100%;
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vi-chart-empty {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #bbb;
    font-size: 13px;
    font-style: italic;
  }

  /* ═══════════════════════════════
     TABLA
  ═══════════════════════════════ */
  .vi-tabla-card {
    background: var(--blanco);
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(110,44,14,0.09);
    border: 1px solid rgba(230,126,34,0.12);
    overflow: hidden;
  }

  .vi-tabla-header {
    background: linear-gradient(135deg, var(--texto-oscuro) 0%, var(--marron) 100%);
    padding: clamp(10px, 2.5vw, 14px) clamp(12px, 3vw, 20px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .vi-tabla-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(13px, 3.5vw, 16px);
    font-weight: 700;
    color: white;
  }

  .vi-tabla-badge {
    background: var(--naranja);
    color: white;
    font-size: clamp(11px, 2.8vw, 12px);
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 12px;
    white-space: nowrap;
  }

  /* Horizontal scroll on small screens */
  .vi-tabla-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table.vi-tabla {
    width: 100%;
    border-collapse: collapse;
    min-width: 320px;   /* never squash columns on tiny screens */
  }

  .vi-tabla thead tr {
    background: var(--crema);
    border-bottom: 2px solid var(--crema-oscuro);
  }

  .vi-tabla th {
    padding: clamp(8px, 2vw, 12px) clamp(10px, 2.5vw, 16px);
    font-size: clamp(9px, 2.2vw, 11px);
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--texto-medio);
    text-align: left;
    white-space: nowrap;
  }

  .vi-tabla tbody tr {
    border-bottom: 1px solid rgba(240,221,184,0.6);
    transition: background 0.15s;
  }

  .vi-tabla tbody tr:last-child { border-bottom: none; }
  .vi-tabla tbody tr:hover { background: var(--crema); }

  .vi-tabla td {
    padding: clamp(8px, 2vw, 13px) clamp(10px, 2.5vw, 16px);
    font-size: clamp(12px, 3vw, 14px);
    color: var(--texto-oscuro);
    vertical-align: middle;
  }

  .vi-folio-pill {
    display: inline-block;
    background: linear-gradient(135deg, var(--texto-oscuro), var(--marron));
    color: white;
    font-size: clamp(10px, 2.5vw, 11px);
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 10px;
    font-family: 'Lato', monospace;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .vi-total-chip {
    display: inline-block;
    background: linear-gradient(135deg, var(--verde), var(--verde-claro));
    color: white;
    font-family: 'Playfair Display', serif;
    font-size: clamp(12px, 3vw, 14px);
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 10px;
    white-space: nowrap;
  }

  .vi-fecha-text {
    color: var(--texto-medio);
    font-size: clamp(11px, 2.8vw, 13px);
    white-space: nowrap;
  }

  .vi-empty-row td {
    text-align: center;
    padding: clamp(28px, 8vw, 48px);
    color: #bbb;
    font-style: italic;
    font-size: clamp(12px, 3vw, 14px);
  }

  /* ═══════════════════════════════
     LARGE DESKTOP (> 1200px)
  ═══════════════════════════════ */
  @media (min-width: 1200px) {
    .vi-body { max-width: 1100px; }
  }
`;

// ── Helpers ──────────────────────────────────────────────
const fmt = (n) => `$${Number(n).toFixed(2)}`;

const agruparPorDia = (ventas) => {
  const mapa = {};
  ventas.forEach((v) => {
    const dia = new Date(v.fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });
    mapa[dia] = (mapa[dia] || 0) + Number(v.total);
  });
  return Object.entries(mapa).slice(-7);
};

const agruparPorSemana = (ventas) => {
  const mapa = {};
  ventas.forEach((v) => {
    const d = new Date(v.fecha);
    const semana = `S${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString("es-MX", { month: "short" })}`;
    mapa[semana] = (mapa[semana] || 0) + Number(v.total);
  });
  return Object.entries(mapa).slice(-6);
};

// ── Componente gráfica de barras ──────────────────────────
function BarChart({ datos }) {
  const max = Math.max(...datos.map(([, v]) => v), 1);
  if (datos.length === 0) {
    return (
      <div className="vi-chart-empty">
        Sin datos suficientes para la gráfica
      </div>
    );
  }
  return (
    <div className="vi-bars-container">
      {datos.map(([label, valor], i) => {
        const pct = (valor / max) * 100;
        return (
          <div key={i} className="vi-bar-wrap">
            <div className="vi-bar-tooltip">{fmt(valor)}</div>
            <div
              className="vi-bar"
              style={{ height: `${Math.max(pct, 3)}%` }}
            />
            <span className="vi-bar-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────
function VentasIngresos() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [tab, setTab] = useState("dia");

  useEffect(() => {
    const cargarVentas = async () => {
      if (isWeb()) {
        const data = JSON.parse(localStorage.getItem("ventas")) || [];
        setVentas([...data].reverse());
      } else {
        const db = getDB();
        const res = await db.query("SELECT * FROM ventas ORDER BY id DESC");
        setVentas(res?.values || []);
      }
    };
    cargarVentas();
  }, []);

  const totalGeneral = useMemo(
    () => ventas.reduce((acc, v) => acc + Number(v.total), 0),
    [ventas],
  );

  const ticketPromedio = ventas.length > 0 ? totalGeneral / ventas.length : 0;

  const datosDia = useMemo(
    () => agruparPorDia([...ventas].reverse()),
    [ventas],
  );
  const datosSemana = useMemo(
    () => agruparPorSemana([...ventas].reverse()),
    [ventas],
  );
  const datosGrafica = tab === "dia" ? datosDia : datosSemana;

  const formatearFecha = (f) => {
    try {
      return new Date(f).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return f;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="vi-app">
        {/* Header */}
        <div className="vi-header">
          <button className="vi-btn-back" onClick={() => navigate("/")}>
            ← Regresar
          </button>
          <div className="vi-header-title">
            💰 Ventas e <span>Ingresos</span>
          </div>
          {/* spacer para centrar el título */}
          <div className="vi-header-spacer" aria-hidden="true" />
        </div>

        <div className="vi-body">
          {/* Stats */}
          <div className="vi-stats-grid">
            <div className="vi-stat-card vi-stat-total">
              <span className="vi-stat-icon">💵</span>
              <div className="vi-stat-info">
                <div className="vi-stat-label">Total Acumulado</div>
                <div className="vi-stat-value">{fmt(totalGeneral)}</div>
              </div>
            </div>
            <div className="vi-stat-card vi-stat-count">
              <span className="vi-stat-icon">🧾</span>
              <div className="vi-stat-info">
                <div className="vi-stat-label">Ventas</div>
                <div className="vi-stat-value">{ventas.length}</div>
              </div>
            </div>
            <div className="vi-stat-card vi-stat-avg">
              <span className="vi-stat-icon">📊</span>
              <div className="vi-stat-info">
                <div className="vi-stat-label">Ticket Promedio</div>
                <div className="vi-stat-value">{fmt(ticketPromedio)}</div>
              </div>
            </div>
          </div>

          {/* Gráfica */}
          <div className="vi-section-label">Análisis de ventas</div>
          <div className="vi-chart-card">
            <div className="vi-chart-header">
              <div className="vi-chart-title">📈 Ingresos por período</div>
              <div className="vi-chart-tabs">
                <button
                  className={`vi-chart-tab ${tab === "dia" ? "active" : ""}`}
                  onClick={() => setTab("dia")}
                >
                  Diario
                </button>
                <button
                  className={`vi-chart-tab ${tab === "semana" ? "active" : ""}`}
                  onClick={() => setTab("semana")}
                >
                  Semanal
                </button>
              </div>
            </div>
            <div className="vi-chart-body">
              <BarChart datos={datosGrafica} />
            </div>
          </div>

          {/* Tabla */}
          <div className="vi-section-label">Historial de ventas</div>
          <div className="vi-tabla-card">
            <div className="vi-tabla-header">
              <div className="vi-tabla-title">📋 Registro de transacciones</div>
              <div className="vi-tabla-badge">{ventas.length} ventas</div>
            </div>
            <div className="vi-tabla-wrap">
              <table className="vi-tabla">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Fecha y hora</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.length === 0 ? (
                    <tr className="vi-empty-row">
                      <td colSpan="3">No hay ventas registradas</td>
                    </tr>
                  ) : (
                    ventas.map((venta) => (
                      <tr key={venta.id}>
                        <td>
                          <span className="vi-folio-pill">
                            #
                            {venta.folio
                              ? String(venta.folio).padStart(9, "0")
                              : venta.id}
                          </span>
                        </td>
                        <td>
                          <span className="vi-fecha-text">
                            {formatearFecha(venta.fecha)}
                          </span>
                        </td>
                        <td>
                          <span className="vi-total-chip">
                            {fmt(venta.total)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default VentasIngresos;
