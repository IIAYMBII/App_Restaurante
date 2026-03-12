import { useEffect, useState } from "react";
import { getDB, isWeb } from "../database/database";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const CATEGORIAS = [
  { id: 1, nombre: "Tacos", emoji: "🌮" },
  { id: 2, nombre: "Tortas", emoji: "🥪" },
  { id: 3, nombre: "Gorditas", emoji: "🫓" },
  { id: 4, nombre: "Gringas", emoji: "🫔" },
  { id: 5, nombre: "Volcanes", emoji: "🌋" },
  { id: 6, nombre: "Burritos", emoji: "🌯" },
  { id: 7, nombre: "Especiales", emoji: "🌮" },
  { id: 8, nombre: "Bebidas", emoji: "🥤" },
];

const getCat = (id) =>
  CATEGORIAS.find((c) => c.id === (id || 1)) || CATEGORIAS[0];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700;900&display=swap');

  :root {
    --rojo: #C0392B; --rojo-oscuro: #922B21;
    --naranja: #E67E22; --naranja-claro: #F39C12;
    --crema: #FDF6EC; --crema-oscuro: #F0DDB8;
    --marron: #6E2C0E; --marron-claro: #A04000;
    --texto-oscuro: #2C1810; --texto-medio: #5D4037;
    --blanco: #FFFDF9;
    --azul: #1A3A5C; --azul-claro: #2980B9;
    --verde: #1E6B3C; --verde-claro: #27AE60;
  }

  * { box-sizing: border-box; }

  .cc-app {
    font-family: 'Lato', sans-serif; min-height: 100vh;
    background-color: var(--crema);
    background-image:
      radial-gradient(ellipse at top left, rgba(192,57,43,0.06) 0%, transparent 55%),
      radial-gradient(ellipse at bottom right, rgba(230,126,34,0.08) 0%, transparent 55%);
  }

  /* HEADER */
  .cc-header {
    background: linear-gradient(135deg, var(--azul) 0%, #1e4976 60%, var(--azul-claro) 100%);
    padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 4px 20px rgba(26,58,92,0.4); position: sticky; top: 0; z-index: 100; overflow: hidden;
  }
  .cc-header::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 150px; height: 150px; border-radius: 50%; background: rgba(255,255,255,0.05); pointer-events: none;
  }
  .cc-header::after {
    content: ''; position: absolute; bottom: -30px; left: 20%;
    width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,0.03); pointer-events: none;
  }
  .cc-header-title {
    font-family: 'Playfair Display', serif; font-size: clamp(15px, 4vw, 20px);
    font-weight: 700; color: white; text-shadow: 0 1px 8px rgba(0,0,0,0.3);
    text-align: center; flex: 1;
  }
  .cc-header-title span { color: #7EC8E3; }
  .cc-btn-back {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
    color: #fff; padding: 7px 14px; border-radius: 20px; font-size: clamp(11px, 3vw, 13px);
    cursor: pointer; font-family: 'Lato', sans-serif; transition: all 0.2s;
    backdrop-filter: blur(4px); white-space: nowrap; flex-shrink: 0;
  }
  .cc-btn-back:hover { background: rgba(255,255,255,0.22); }
  .cc-header-spacer { width: 90px; flex-shrink: 0; }

  /* BODY */
  .cc-body { padding: clamp(12px, 4vw, 24px); max-width: 960px; margin: 0 auto; width: 100%; }

  /* FILTRO */
  .cc-filtro-card {
    background: var(--blanco); border-radius: 14px;
    box-shadow: 0 2px 16px rgba(110,44,14,0.08); border: 1px solid rgba(230,126,34,0.12);
    padding: clamp(14px, 3vw, 18px) clamp(14px, 3vw, 20px); margin-bottom: 20px;
  }
  .cc-filtro-label {
    font-size: clamp(10px, 2.5vw, 11px); font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--texto-medio); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .cc-filtro-inputs { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: center; }
  @media (max-width: 480px) {
    .cc-filtro-inputs { grid-template-columns: 1fr 1fr; }
    .cc-btn-limpiar { grid-column: 1 / -1; }
  }
  @media (max-width: 320px) { .cc-filtro-inputs { grid-template-columns: 1fr; } }
  .cc-input-fecha {
    padding: 10px 12px; border: 2px solid var(--crema-oscuro); border-radius: 10px;
    font-family: 'Lato', sans-serif; font-size: clamp(12px, 3.5vw, 14px);
    color: var(--texto-oscuro); background: var(--crema); outline: none;
    transition: border-color 0.2s; width: 100%; min-width: 0;
  }
  .cc-input-fecha:focus { border-color: var(--azul-claro); }
  .cc-btn-limpiar {
    padding: 10px 14px; border: 2px solid var(--crema-oscuro); border-radius: 10px;
    background: transparent; color: var(--texto-medio); font-family: 'Lato', sans-serif;
    font-size: clamp(11px, 3vw, 13px); font-weight: 700; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
  }
  .cc-btn-limpiar:hover { border-color: var(--rojo); color: var(--rojo); }

  /* DASHBOARD */
  .cc-dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 22px; }
  @media (max-width: 340px) { .cc-dashboard { grid-template-columns: 1fr; } }
  .cc-stat-card {
    border-radius: 14px; padding: clamp(14px, 3.5vw, 20px);
    display: flex; align-items: center; gap: clamp(10px, 3vw, 16px);
    box-shadow: 0 3px 16px rgba(0,0,0,0.1); position: relative; overflow: hidden; min-width: 0;
  }
  .cc-stat-card::after {
    content: ''; position: absolute; top: -20px; right: -20px;
    width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.1); pointer-events: none;
  }
  .cc-stat-card-total  { background: linear-gradient(135deg, var(--verde) 0%, var(--verde-claro) 100%); }
  .cc-stat-card-ventas { background: linear-gradient(135deg, var(--azul)  0%, var(--azul-claro)  100%); }
  .cc-stat-icon { font-size: clamp(24px, 6vw, 32px); flex-shrink: 0; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2)); }
  .cc-stat-info { flex: 1; min-width: 0; }
  .cc-stat-label {
    font-size: clamp(9px, 2.2vw, 11px); font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: rgba(255,255,255,0.75); margin-bottom: 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cc-stat-value {
    font-family: 'Playfair Display', serif; font-size: clamp(20px, 5vw, 28px);
    font-weight: 900; color: white; line-height: 1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* SECTION LABEL */
  .cc-section-label {
    font-size: clamp(9px, 2.5vw, 11px); font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--marron); opacity: 0.6;
    margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
  }
  .cc-section-label::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(to right, var(--crema-oscuro), transparent);
  }

  /* VENTAS GRID */
  .cc-ventas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: clamp(12px, 3vw, 16px);
  }
  .cc-venta-card {
    background: var(--blanco); border-radius: 14px; overflow: hidden;
    box-shadow: 0 2px 12px rgba(110,44,14,0.09); border: 1px solid rgba(230,126,34,0.1);
    transition: transform 0.2s, box-shadow 0.2s; min-width: 0;
  }
  .cc-venta-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(110,44,14,0.14); }

  .cc-venta-header {
    background: linear-gradient(135deg, var(--texto-oscuro) 0%, var(--marron) 100%);
    padding: 12px 14px; display: flex; align-items: center;
    justify-content: space-between; gap: 8px; flex-wrap: wrap;
  }
  .cc-venta-folio {
    font-family: 'Playfair Display', serif; font-size: clamp(11px, 3vw, 13px);
    font-weight: 700; color: white; letter-spacing: 0.5px;
  }
  .cc-venta-fecha { font-size: clamp(10px, 2.5vw, 11px); color: rgba(255,255,255,0.6); margin-top: 2px; }
  .cc-venta-total-badge {
    background: var(--naranja); color: white; font-size: clamp(12px, 3.5vw, 14px);
    font-weight: 900; font-family: 'Playfair Display', serif;
    padding: 3px 10px; border-radius: 12px; white-space: nowrap;
  }

  .cc-venta-body { padding: clamp(10px, 3vw, 14px) clamp(12px, 3.5vw, 16px); }
  .cc-venta-detalle-title {
    font-size: clamp(10px, 2.5vw, 11px); font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: var(--texto-medio); margin-bottom: 10px; opacity: 0.7;
  }

  /* Lista ítems */
  .cc-detalle-lista {
    list-style: none; padding: 0; margin: 0;
    max-height: 220px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 6px;
  }
  .cc-detalle-lista::-webkit-scrollbar { width: 3px; }
  .cc-detalle-lista::-webkit-scrollbar-track { background: var(--crema); }
  .cc-detalle-lista::-webkit-scrollbar-thumb { background: var(--naranja); border-radius: 3px; }

  .cc-detalle-item {
    display: flex; flex-direction: column; gap: 4px;
    padding: 8px 10px; background: var(--crema); border-radius: 10px;
  }
  .cc-detalle-row-top {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .cc-detalle-item-nombre {
    font-weight: 700; color: var(--texto-oscuro); font-size: clamp(12px, 3vw, 13px);
    flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .cc-detalle-item-precio {
    font-family: 'Playfair Display', serif; font-weight: 700; color: var(--rojo);
    font-size: clamp(12px, 3vw, 13px); flex-shrink: 0; white-space: nowrap;
  }
  .cc-detalle-row-sub { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .cc-detalle-cat-tag {
    font-size: clamp(9px, 2.2vw, 10px); font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: white; background: var(--naranja);
    padding: 1px 6px; border-radius: 6px; white-space: nowrap;
  }
  .cc-detalle-item-cant {
    background: var(--crema-oscuro); color: var(--texto-medio);
    font-size: clamp(9px, 2.2vw, 10px); font-weight: 700;
    padding: 1px 6px; border-radius: 6px; white-space: nowrap;
  }
  .cc-detalle-precio-unit {
    font-size: clamp(9px, 2.2vw, 10px); color: var(--texto-medio); white-space: nowrap;
  }
  .cc-detalle-vacio { text-align: center; color: #bbb; font-size: 12px; padding: 12px; font-style: italic; }

  /* ── BOTÓN IMPRIMIR ── */
  .cc-venta-footer {
    padding: 10px 14px 14px;
    border-top: 1px dashed rgba(230,126,34,0.25);
  }
  .cc-btn-imprimir {
    width: 100%;
    padding: 10px 0;
    background: linear-gradient(135deg, var(--marron) 0%, var(--marron-claro) 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-family: 'Lato', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    letter-spacing: 0.4px;
    transition: all 0.2s;
    box-shadow: 0 3px 10px rgba(110,44,14,0.2);
    -webkit-tap-highlight-color: transparent;
  }
  .cc-btn-imprimir:hover {
    filter: brightness(1.1);
    box-shadow: 0 5px 16px rgba(110,44,14,0.3);
    transform: translateY(-1px);
  }
  .cc-btn-imprimir:active { transform: scale(0.97); }
  .cc-btn-imprimir:disabled {
    background: #ccc; box-shadow: none; cursor: not-allowed; transform: none; filter: none;
  }

  /* ── OVERLAY IMPRIMIENDO ── */
  .cc-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 9999;
  }
  .cc-overlay-box {
    background: white; border-radius: 16px; padding: 28px 36px;
    text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  }
  .cc-overlay-icon { font-size: 44px; display: block; margin-bottom: 10px; animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .cc-overlay-text { font-family: 'Lato', sans-serif; font-size: 15px; font-weight: 700; color: #333; }

  /* EMPTY */
  .cc-empty {
    text-align: center; padding: clamp(36px, 8vw, 60px) 20px; background: var(--blanco);
    border-radius: 16px; box-shadow: 0 2px 12px rgba(110,44,14,0.07);
    border: 1px dashed var(--crema-oscuro);
  }
  .cc-empty-icon { font-size: clamp(36px, 10vw, 52px); display: block; margin-bottom: 12px; }
  .cc-empty-title {
    font-family: 'Playfair Display', serif; font-size: clamp(16px, 4vw, 20px);
    font-weight: 700; color: var(--texto-oscuro); opacity: 0.5; margin-bottom: 6px;
  }
  .cc-empty-sub { font-size: clamp(11px, 3vw, 13px); color: var(--texto-medio); opacity: 0.5; }

  @media (min-width: 600px) and (max-width: 900px) { .cc-body { padding: 20px; } }
  @media (min-width: 1200px) {
    .cc-body { max-width: 1100px; }
    .cc-ventas-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;

function CorteCaja() {
  const [ventasHoy, setVentasHoy] = useState([]);
  const [totalVendido, setTotalVendido] = useState(0);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [imprimiendo, setImprimiendo] = useState(false);
  const navigate = useNavigate();

  const cargarVentas = async () => {
    let ventas = [];
    if (isWeb()) {
      const data = localStorage.getItem("ventas");
      ventas = data ? JSON.parse(data) : [];
      ventas = ventas.map((v) => ({ ...v, detalle: v.detalle || [] }));
    } else {
      const db = getDB();
      const res = await db.query("SELECT * FROM ventas");
      const ventasDB = res?.values || [];
      for (let venta of ventasDB) {
        const detallesDB = await db.query(
          "SELECT * FROM detalle_venta WHERE venta_id = ?",
          [venta.id],
        );
        const detallesArray = (detallesDB?.values || []).filter(
          (d) => d && Object.keys(d).length > 0,
        );
        ventas.push({ ...venta, detalle: detallesArray });
      }
    }

    let filtradas = ventas;
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio + "T00:00:00");
      const fin = new Date(fechaFin + "T23:59:59");
      filtradas = ventas.filter((v) => {
        const fv = new Date(v.fecha);
        return fv >= inicio && fv <= fin;
      });
    } else {
      const hoy = new Date();
      filtradas = ventas.filter((v) => {
        const fv = new Date(v.fecha);
        return (
          fv.getDate() === hoy.getDate() &&
          fv.getMonth() === hoy.getMonth() &&
          fv.getFullYear() === hoy.getFullYear()
        );
      });
    }
    setVentasHoy(filtradas);
    setTotalVendido(filtradas.reduce((acc, v) => acc + v.total, 0));
  };

  useEffect(() => {
    cargarVentas();
  }, [fechaInicio, fechaFin]);
  const limpiarFiltro = () => {
    setFechaInicio("");
    setFechaFin("");
  };

  const formatearFecha = (fechaStr) => {
    try {
      return new Date(fechaStr).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  // ── Cargar imagen a base64 ──────────────────────────────────────────
  const cargarImagenBase64 = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png").split(",")[1]);
      };
      img.onerror = reject;
      img.src = src;
    });
  // ── Generar PDF de una venta del historial ──────────────────────────
  const imprimirTicket = async (venta) => {
    setImprimiendo(true);
    try {
      const fechaTexto = new Date(venta.fecha).toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Altura dinámica según productos
      const alturaBase = 110;
      const alturaItems = (venta.detalle?.length || 1) * 14;
      const alturaTotal = alturaBase + alturaItems;

      const doc = new jsPDF({ unit: "mm", format: [80, alturaTotal] });
      let y = 8;

      // ── Logo ──────────────────────────────────────────────────────────
      try {
        const logoBase64 = await cargarImagenBase64("/assets/tacos.png");
        const logoW = 24,
          logoH = 24;
        doc.addImage(logoBase64, "PNG", (80 - logoW) / 2, y, logoW, logoH);
        y += logoH + 4;
      } catch {
        y += 2;
      }

      // ── Nombre del negocio ────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(0, 0, 0);
      doc.text("TACOS RIVERA", 40, y, { align: "center" });
      y += 5.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text("C. Bahía de Sta. Bárbara 367, Miguel Hidalgo", 40, y, {
        align: "center",
      });
      y += 4;

      // ── Línea gruesa ─────────────────────────────────────────────────
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(5, y, 75, y);
      y += 5;

      // ── Folio ────────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`# ${String(venta.folio).padStart(9, "0")}`, 5, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(fechaTexto, 75, y, { align: "right" });
      y += 7;

      // ── Línea punteada ────────────────────────────────────────────────
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.setLineWidth(0.35);
      doc.setDrawColor(0, 0, 0);
      doc.line(5, y, 75, y);
      doc.setLineDashPattern([], 0);
      y += 5;

      // ── Ítems ─────────────────────────────────────────────────────────
      (venta.detalle || []).forEach((item) => {
        const nombre =
          item.nombre.length > 22
            ? item.nombre.substring(0, 20) + ".."
            : item.nombre;
        const cat = getCat(item.categoria);

        // Nombre del producto + importe alineado a la derecha
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(nombre, 5, y);
        doc.text(`$${(item.precio * item.cantidad).toFixed(2)}`, 75, y, {
          align: "right",
        });
        y += 5;

        // Categoría · cantidad · precio unitario
        const subLinea = `${cat.nombre}  ×${item.cantidad}  $${item.precio.toFixed(2)} c/u`;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(subLinea, 5, y);
        y += 7;
      });

      // ── Línea gruesa ─────────────────────────────────────────────────
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(5, y, 75, y);
      y += 6;

      // ── TOTAL ─────────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("TOTAL", 5, y);
      doc.text(`$${venta.total.toFixed(2)}`, 75, y, { align: "right" });
      y += 10;

      // ── Línea punteada final ──────────────────────────────────────────
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.setLineWidth(0.35);
      doc.setDrawColor(0, 0, 0);
      doc.line(5, y, 75, y);
      doc.setLineDashPattern([], 0);
      y += 7;

      // ── Mensaje final ─────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("¡GRACIAS POR SU COMPRA!", 40, y, { align: "center" });
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text("¡Vuelva pronto!", 40, y, { align: "center" });

      // ── Exportar / Compartir ──────────────────────────────────────────
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      const nombreArchivo = `ticket_${String(venta.folio).padStart(9, "0")}.pdf`;

      try {
        const archivo = await Filesystem.writeFile({
          path: nombreArchivo,
          data: pdfBase64,
          directory: Directory.Cache,
        });
        await Share.share({
          title: `Ticket Folio ${String(venta.folio).padStart(9, "0")}`,
          text: `Ticket · Total: $${venta.total.toFixed(2)}`,
          url: archivo.uri,
          dialogTitle: "Imprimir o guardar ticket...",
        });
      } catch {
        const blob = doc.output("blob");
        window.open(URL.createObjectURL(blob), "_blank");
      }
    } catch (e) {
      console.error("Error imprimiendo ticket:", e);
    } finally {
      setImprimiendo(false);
    }
  };
  return (
    <>
      <style>{styles}</style>
      <div className="cc-app">
        {/* Overlay imprimiendo */}
        {imprimiendo && (
          <div className="cc-overlay">
            <div className="cc-overlay-box">
              <span className="cc-overlay-icon">🖨️</span>
              <div className="cc-overlay-text">Generando ticket…</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="cc-header">
          <button className="cc-btn-back" onClick={() => navigate("/")}>
            ← Regresar
          </button>
          <div className="cc-header-title">
            🧾 Corte de <span>Caja</span>
          </div>
          <div className="cc-header-spacer" aria-hidden="true" />
        </div>

        <div className="cc-body">
          {/* Filtro */}
          <div className="cc-filtro-card">
            <div className="cc-filtro-label">📅 Filtrar por período</div>
            <div className="cc-filtro-inputs">
              <input
                type="date"
                className="cc-input-fecha"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
              <input
                type="date"
                className="cc-input-fecha"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
              {(fechaInicio || fechaFin) && (
                <button className="cc-btn-limpiar" onClick={limpiarFiltro}>
                  ✕ Hoy
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="cc-dashboard">
            <div className="cc-stat-card cc-stat-card-total">
              <span className="cc-stat-icon">💵</span>
              <div className="cc-stat-info">
                <div className="cc-stat-label">Total Vendido</div>
                <div className="cc-stat-value">${totalVendido.toFixed(2)}</div>
              </div>
            </div>
            <div className="cc-stat-card cc-stat-card-ventas">
              <span className="cc-stat-icon">🧾</span>
              <div className="cc-stat-info">
                <div className="cc-stat-label">Órdenes</div>
                <div className="cc-stat-value">{ventasHoy.length}</div>
              </div>
            </div>
          </div>

          <div className="cc-section-label">
            {fechaInicio && fechaFin ? "Ventas del período" : "Ventas de hoy"}
          </div>

          {ventasHoy.length === 0 ? (
            <div className="cc-empty">
              <span className="cc-empty-icon">🧾</span>
              <div className="cc-empty-title">Sin ventas registradas</div>
              <div className="cc-empty-sub">
                {fechaInicio
                  ? "No hay ventas en ese período"
                  : "No hay ventas para hoy"}
              </div>
            </div>
          ) : (
            <div className="cc-ventas-grid">
              {ventasHoy.map((v) => (
                <div key={v.id} className="cc-venta-card">
                  <div className="cc-venta-header">
                    <div>
                      <div className="cc-venta-folio">
                        Folio #{String(v.folio).padStart(9, "0")}
                      </div>
                      <div className="cc-venta-fecha">
                        {formatearFecha(v.fecha)}
                      </div>
                    </div>
                    <div className="cc-venta-total-badge">
                      ${v.total.toFixed(2)}
                    </div>
                  </div>

                  <div className="cc-venta-body">
                    <div className="cc-venta-detalle-title">
                      Detalle de la orden
                    </div>
                    {v.detalle && v.detalle.length > 0 ? (
                      <ul className="cc-detalle-lista">
                        {v.detalle.map((item, idx) => {
                          const cat = getCat(item.categoria);
                          return (
                            <li key={idx} className="cc-detalle-item">
                              <div className="cc-detalle-row-top">
                                <span className="cc-detalle-item-nombre">
                                  {item.nombre}
                                </span>
                                <span className="cc-detalle-item-precio">
                                  ${(item.precio * item.cantidad).toFixed(2)}
                                </span>
                              </div>
                              <div className="cc-detalle-row-sub">
                                <span className="cc-detalle-cat-tag">
                                  {cat.emoji} {cat.nombre}
                                </span>
                                <span className="cc-detalle-item-cant">
                                  ×{item.cantidad}
                                </span>
                                <span className="cc-detalle-precio-unit">
                                  ${item.precio.toFixed(2)} c/u
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="cc-detalle-vacio">
                        Sin detalle disponible
                      </div>
                    )}
                  </div>

                  {/* ── BOTÓN IMPRIMIR ── */}
                  <div className="cc-venta-footer">
                    <button
                      className="cc-btn-imprimir"
                      onClick={() => imprimirTicket(v)}
                      disabled={imprimiendo}
                    >
                      🖨️ Reimprimir Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CorteCaja;
