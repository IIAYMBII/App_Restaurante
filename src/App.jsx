import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import PantallaVentas from "./pages/PantallaVentas";
import Productos from "./pages/Productos";
import VentasIngresos from "./pages/VentasIngresos";
import CorteCaja from "./pages/CorteCaja";
import PanelEstadistica from "./pages/Panelestadistica";
import { getDB, isWeb } from "./database/database";
import logo from "./assets/tacos.png";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700;900&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
  }

  html { width: 100%; overflow-x: hidden; }

  body {
    width: 100%;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: none;
    margin: 0 !important;
    padding: 0 !important;
  }

  #root {
    width: 100%;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    display: flex;
    flex-direction: column;
  }

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
    --blanco: #FFFDF9;
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
  }

  .rv-menu-app {
    font-family: 'Lato', sans-serif;
    width: 100%;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    background-color: var(--crema);
    background-image:
      radial-gradient(ellipse at top left, rgba(192,57,43,0.08) 0%, transparent 55%),
      radial-gradient(ellipse at bottom right, rgba(230,126,34,0.1) 0%, transparent 55%);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    padding-top: var(--safe-top);
    padding-bottom: var(--safe-bottom);
  }

  /* ── HERO ── */
  .rv-hero {
    width: 100%;
    background: linear-gradient(160deg, var(--rojo-oscuro) 0%, var(--rojo) 45%, var(--marron-claro) 100%);
    padding: 36px 20px 44px;
    text-align: center;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .rv-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      45deg, transparent, transparent 18px,
      rgba(255,255,255,0.025) 18px, rgba(255,255,255,0.025) 36px
    );
    pointer-events: none;
  }

  .rv-hero-circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.05); pointer-events: none; }
  .rv-hero-circle-1 { width: 160px; height: 160px; top: -50px; right: -50px; }
  .rv-hero-circle-2 { width: 100px; height: 100px; bottom: -30px; left: 8%; }
  .rv-hero-circle-3 { width: 50px;  height: 50px;  top: 25%;    left: 4%; }

  .rv-hero-badge {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    color: var(--naranja-claro);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 20px;
    margin-bottom: 14px;
    backdrop-filter: blur(4px);
    position: relative;
    max-width: calc(100% - 32px);
    word-break: break-word;
  }

  .rv-hero-emoji {
    font-size: 48px;
    display: block;
    margin-bottom: 8px;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
    animation: flotar 3s ease-in-out infinite;
    position: relative;
  }

  @keyframes flotar {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-7px); }
  }

  .rv-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(26px, 8vw, 40px);
    font-weight: 900;
    color: white;
    line-height: 1.1;
    text-shadow: 0 2px 16px rgba(0,0,0,0.3);
    position: relative;
    word-break: break-word;
  }

  .rv-hero-title em { font-style: italic; color: var(--naranja-claro); }

  .rv-hero-sub {
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.8px;
    margin-top: 6px;
    position: relative;
    word-break: break-word;
  }

  /* ── TICKER ── */
  .rv-ticker {
    width: 100%;
    background: var(--naranja);
    padding: 8px 0;
    overflow: hidden;
    white-space: nowrap;
    touch-action: none;
    user-select: none;
    flex-shrink: 0;
  }

  .rv-ticker-inner {
    display: inline-flex;
    animation: ticker 18s linear infinite;
  }

  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  .rv-ticker-item {
    font-size: 10px;
    font-weight: 700;
    color: white;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 0 20px;
    white-space: nowrap;
  }

  .rv-ticker-dot { color: rgba(255,255,255,0.5); padding: 0 3px; }

  /* ── BODY ── */
  .rv-menu-body {
    flex: 1;
    width: 100%;
    padding: 24px 16px 28px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }

  .rv-section-label {
    font-size: 10px;
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

  .rv-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--crema-oscuro), transparent);
  }

  .rv-nav-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  /* ── BOTONES NAV ── */
  .rv-nav-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 72px;
    padding: 14px 16px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 3px 12px rgba(0,0,0,0.12);
    -webkit-user-select: none;
    user-select: none;
  }

  .rv-nav-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
    pointer-events: none;
  }

  .rv-nav-btn:active {
    transform: scale(0.97);
    box-shadow: 0 1px 6px rgba(0,0,0,0.15);
  }

  @media (hover: hover) {
    .rv-nav-btn:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 7px 20px rgba(0,0,0,0.18);
    }
    .rv-nav-btn:hover .rv-nav-arrow {
      transform: translateX(4px);
      color: rgba(255,255,255,0.9);
    }
  }

  .rv-btn-ventas    { background: linear-gradient(135deg, #C0392B 0%, #E74C3C 100%); }
  .rv-btn-productos { background: linear-gradient(135deg, #A04000 0%, #E67E22 100%); }
  .rv-btn-ingresos  { background: linear-gradient(135deg, #1E6B3C 0%, #27AE60 100%); }
  .rv-btn-corte     { background: linear-gradient(135deg, #1A3A5C 0%, #2980B9 100%); }
  .rv-btn-estadisticas { background: linear-gradient(135deg, #411a5cff 0%, #9329b9ff 100%); }

  .rv-nav-icon-wrap {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 12px;
    background: rgba(255,255,255,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }

  .rv-nav-text { flex: 1; min-width: 0; }

  .rv-nav-title {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: white;
    line-height: 1.2;
    text-shadow: 0 1px 4px rgba(0,0,0,0.2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rv-nav-desc {
    font-size: 12px;
    color: rgba(255,255,255,0.72);
    margin-top: 2px;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rv-nav-arrow {
    color: rgba(255,255,255,0.5);
    font-size: 20px;
    flex-shrink: 0;
    transition: transform 0.2s, color 0.2s;
    padding-left: 4px;
  }

  /* ── BOTÓN BORRAR HISTORIAL ── */
  .rv-danger-section {
    margin-top: 20px;
  }

  .rv-btn-borrar {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 64px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 2px dashed rgba(192,57,43,0.5);
    cursor: pointer;
    text-align: left;
    width: 100%;
    background: rgba(192,57,43,0.07);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    -webkit-user-select: none;
    user-select: none;
  }

  .rv-btn-borrar:hover {
    background: rgba(192,57,43,0.13);
    border-color: var(--rojo);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(192,57,43,0.2);
  }

  .rv-btn-borrar:active { transform: scale(0.97); }

  .rv-btn-borrar .rv-nav-icon-wrap {
    background: rgba(192,57,43,0.15);
  }

  .rv-btn-borrar .rv-nav-title {
    color: var(--rojo);
    text-shadow: none;
  }

  .rv-btn-borrar .rv-nav-desc {
    color: rgba(192,57,43,0.65);
  }

  .rv-btn-borrar .rv-nav-arrow {
    color: rgba(192,57,43,0.4);
  }

  /* ── MODAL ADVERTENCIA ── */
  .rv-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(44,24,16,0.65);
    backdrop-filter: blur(6px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .rv-modal {
    background: var(--blanco);
    border-radius: 22px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    overflow: hidden;
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .rv-modal-top {
    background: linear-gradient(135deg, var(--rojo-oscuro) 0%, var(--rojo) 100%);
    padding: 28px 24px 22px;
    text-align: center;
    position: relative;
  }

  .rv-modal-icon {
    font-size: 52px;
    display: block;
    margin-bottom: 10px;
    animation: shake 0.5s ease 0.3s;
  }

  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    20%       { transform: rotate(-8deg); }
    40%       { transform: rotate(8deg); }
    60%       { transform: rotate(-5deg); }
    80%       { transform: rotate(5deg); }
  }

  .rv-modal-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 900;
    color: white;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
    margin-bottom: 6px;
  }

  .rv-modal-subtitulo {
    font-size: 12px;
    color: rgba(255,255,255,0.72);
    font-weight: 400;
    letter-spacing: 0.5px;
  }

  .rv-modal-body {
    padding: 22px 24px;
  }

  .rv-modal-aviso {
    background: rgba(192,57,43,0.08);
    border: 1px solid rgba(192,57,43,0.2);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }

  .rv-modal-aviso-title {
    font-weight: 700;
    font-size: 13px;
    color: var(--rojo);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .rv-modal-aviso-lista {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rv-modal-aviso-lista li {
    font-size: 12px;
    color: var(--texto-oscuro);
    opacity: 0.75;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .rv-modal-aviso-lista li::before {
    content: '•';
    color: var(--rojo);
    font-weight: 900;
    flex-shrink: 0;
  }

  .rv-modal-irreversible {
    font-size: 12px;
    font-weight: 700;
    color: var(--rojo);
    text-align: center;
    margin-bottom: 18px;
    opacity: 0.8;
    letter-spacing: 0.3px;
  }

  .rv-modal-btns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .rv-modal-btn-cancelar {
    padding: 13px;
    border-radius: 12px;
    border: 2px solid var(--crema-oscuro);
    background: transparent;
    color: var(--texto-oscuro);
    font-family: 'Lato', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .rv-modal-btn-cancelar:hover {
    background: var(--crema);
    border-color: var(--marron);
  }

  .rv-modal-btn-confirmar {
    padding: 13px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, var(--rojo-oscuro), var(--rojo));
    color: white;
    font-family: 'Lato', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(192,57,43,0.35);
  }

  .rv-modal-btn-confirmar:hover {
    filter: brightness(1.1);
    box-shadow: 0 6px 18px rgba(192,57,43,0.45);
  }

  .rv-modal-btn-confirmar:active { transform: scale(0.97); }

  /* ── TOAST ── */
  .rv-toast {
    position: fixed;
    bottom: calc(24px + var(--safe-bottom));
    left: 50%;
    transform: translateX(-50%);
    background: #1E6B3C;
    color: white;
    font-size: 13px;
    font-weight: 700;
    padding: 12px 22px;
    border-radius: 30px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    z-index: 99999;
    white-space: nowrap;
    animation: toastIn 0.3s ease, toastOut 0.3s ease 2.2s forwards;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes toastOut {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* ── FOOTER ── */
  .rv-footer {
    width: 100%;
    text-align: center;
    padding: 14px 16px;
    font-size: 11px;
    color: var(--marron);
    opacity: 0.45;
    font-weight: 300;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  @media (max-width: 360px) {
    .rv-hero { padding: 28px 14px 34px; }
    .rv-hero-emoji { font-size: 40px; }
    .rv-menu-body { padding: 20px 12px 24px; }
    .rv-nav-btn { min-height: 64px; padding: 12px 12px; gap: 10px; }
    .rv-nav-icon-wrap { width: 42px; height: 42px; min-width: 42px; font-size: 19px; }
    .rv-nav-title { font-size: 15px; }
    .rv-modal-btns { grid-template-columns: 1fr; }
  }

  @media (min-width: 600px) {
    .rv-menu-body {
      max-width: 540px;
      margin-left: auto;
      margin-right: auto;
      padding: 28px 24px 36px;
    }
  }
`;

const menuItems = [
  {
    key: "ventas",
    path: "/ventas",
    clase: "rv-btn-ventas",
    emoji: "🛒",
    title: "Pantalla de Ventas",
    desc: "Registrar órdenes y cobrar",
  },
  {
    key: "productos",
    path: "/productos",
    clase: "rv-btn-productos",
    emoji: "🌮",
    title: "Agregar Productos",
    desc: "Gestionar el menú",
  },
  {
    key: "ingresos",
    path: "/ingresos",
    clase: "rv-btn-ingresos",
    emoji: "💵",
    title: "Ventas e Ingresos",
    desc: "Historial y reportes",
  },
  {
    key: "corte",
    path: "/corte",
    clase: "rv-btn-corte",
    emoji: "🧾",
    title: "Corte de Caja",
    desc: "Resumen del día",
  },
  {
    key: "estadisticas",
    path: "/estadisticas",
    clase: "rv-btn-estadisticas rv-btn-activo",
    emoji: "📈",
    title: "Estadísticas de Ventas",
    desc: "Más ventas",
  },
];

const tickerItems = [
  "Sabor Auténtico",
  "Servicio Rápido",
  "Calidad Garantizada",
  "Bienvenido",
  "El Mejor Taco",
];

function Menu() {
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [toast, setToast] = useState(false);

  const mostrarModal = () => setModalVisible(true);
  const cerrarModal = () => setModalVisible(false);

  const borrarTodo = async () => {
    try {
      if (isWeb()) {
        // Web: borra solo ventas, los productos se conservan
        localStorage.removeItem("ventas");
      } else {
        // Android SQLite: primero detalles (FK), luego ventas
        const db = getDB();
        await db.execute("DELETE FROM detalle_venta;");
        await db.execute("DELETE FROM ventas;");
      }
      cerrarModal();
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch (e) {
      console.error("Error al borrar ventas:", e);
      cerrarModal();
    }
  };

  return (
    <div className="rv-menu-app">
      <style>{styles}</style>

      {/* HERO */}
      <div className="rv-hero">
        <div className="rv-hero-circle rv-hero-circle-1" />
        <div className="rv-hero-circle rv-hero-circle-2" />
        <div className="rv-hero-circle rv-hero-circle-3" />
        <div className="rv-hero-badge">✦ Sistema de Punto de Venta ✦</div>
        <span className="rv-hero-emoji">
          <span role="img" aria-label="taco">
            <img src={logo} alt="taco" width="100" height="100" />
          </span>
        </span>
        <h1 className="rv-hero-title">
          Tacos <em>Rivera</em>
        </h1>
        <p className="rv-hero-sub">La sazón de siempre, el servicio de hoy</p>
      </div>

      {/* TICKER */}
      <div className="rv-ticker">
        <div className="rv-ticker-inner">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="rv-ticker-item">
              {t} <span className="rv-ticker-dot">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="rv-menu-body">
        <div className="rv-section-label">Acceso rápido</div>
        <nav className="rv-nav-grid">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`rv-nav-btn ${item.clase}`}
              onClick={() => navigate(item.path)}
            >
              <div className="rv-nav-icon-wrap">{item.emoji}</div>
              <div className="rv-nav-text">
                <div className="rv-nav-title">{item.title}</div>
                <div className="rv-nav-desc">{item.desc}</div>
              </div>
              <span className="rv-nav-arrow">›</span>
            </button>
          ))}
        </nav>

        {/* BOTÓN BORRAR */}
        <div className="rv-danger-section">
          <div className="rv-section-label">Zona de peligro</div>
          <button className="rv-nav-btn rv-btn-borrar" onClick={mostrarModal}>
            <div className="rv-nav-icon-wrap">🗑️</div>
            <div className="rv-nav-text">
              <div className="rv-nav-title">Borrar Historial de Ventas</div>
              <div className="rv-nav-desc">
                Eliminar todos los registros permanentemente
              </div>
            </div>
            <span className="rv-nav-arrow">›</span>
          </button>
        </div>
      </div>

      <div className="rv-footer">© Tacos Rivera · Sistema de Gestión v1.0</div>

      {/* MODAL ADVERTENCIA */}
      {modalVisible && (
        <div className="rv-modal-overlay" onClick={cerrarModal}>
          <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rv-modal-top">
              <span className="rv-modal-icon">⚠️</span>
              <div className="rv-modal-titulo">¡Advertencia!</div>
              <div className="rv-modal-subtitulo">
                Esta acción no se puede deshacer
              </div>
            </div>
            <div className="rv-modal-body">
              <div className="rv-modal-aviso">
                <div className="rv-modal-aviso-title">
                  🗑️ Se eliminará permanentemente:
                </div>
                <ul className="rv-modal-aviso-lista">
                  <li>Todo el historial de ventas</li>
                  <li>Los detalles de cada orden</li>
                  <li>Los registros de corte de caja</li>
                  <li>Los folios y totales acumulados</li>
                </ul>
              </div>
              <div className="rv-modal-irreversible">
                ⛔ Esta acción es irreversible
              </div>
              <div className="rv-modal-btns">
                <button className="rv-modal-btn-cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button className="rv-modal-btn-confirmar" onClick={borrarTodo}>
                  Sí, borrar todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST CONFIRMACIÓN */}
      {toast && (
        <div className="rv-toast">✅ Historial borrado correctamente</div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/ventas" element={<PantallaVentas />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/ingresos" element={<VentasIngresos />} />
        <Route path="/corte" element={<CorteCaja />} />
        <Route path="/estadisticas" element={<PanelEstadistica />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
