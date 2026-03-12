import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDB, isWeb } from "../database/database";
import { jsPDF } from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import logo from "../assets/tacos.png";

// ── Categorías ────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: 1, nombre: "Tacos", emoji: "🌮" },
  { id: 2, nombre: "Tortas", emoji: "🥪" },
  { id: 3, nombre: "Gorditas", emoji: "🫓" },
  { id: 4, nombre: "Gringas", emoji: "🫔" },
  { id: 5, nombre: "Volcanes", emoji: "🌋" },
  { id: 6, nombre: "Burritos", emoji: "🌯" },
  { id: 7, nombre: "Especiales", emoji: "🌮" },
  { id: 8, nombre: "Bebidas", emoji: "🥤" },
  { id: 9, nombre: "Carnitas", emoji: "🐖" },
];

const getNombreCategoria = (catId) => {
  const cat = CATEGORIAS.find((c) => c.id === (catId || 1));
  return cat ? cat.nombre : "";
};

// ── Estado inicial de una persona ────────────────────────────────────────
const nuevaPersona = (num) => ({
  id: Date.now() + num,
  nombre: "",
  carrito: [],
  conTodo: false,
  paraLlevar: false,
  sinIngredientes: false,
  ingredientesSin: "",
});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');

  :root {
    --rojo: #C0392B; --rojo-oscuro: #922B21;
    --naranja: #E67E22; --naranja-claro: #F39C12;
    --crema: #FDF6EC; --crema-oscuro: #F5E6C8;
    --marron: #6E2C0E; --marron-claro: #A04000;
    --texto-oscuro: #2C1810; --texto-medio: #5D4037;
    --blanco: #FFFDF9;
    --verde: #1E6B3C; --verde-claro: #27AE60;
    --azul: #1565C0; --azul-claro: #42A5F5;
    --morado: #6A1B9A;
  }

  .rv-app {
    font-family: 'Lato', sans-serif;
    background-color: var(--crema);
    background-image:
      radial-gradient(circle at 10% 20%, rgba(192,57,43,0.06) 0%, transparent 50%),
      radial-gradient(circle at 90% 80%, rgba(230,126,34,0.08) 0%, transparent 50%);
  }

  /* ── HEADER ── */
  .rv-header {
    background: linear-gradient(135deg, var(--rojo-oscuro) 0%, var(--rojo) 60%, var(--marron-claro) 100%);
    padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 4px 20px rgba(146,43,33,0.4); position: relative; overflow: hidden;
  }
  .rv-header::before { content:''; position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%; background:rgba(255,255,255,0.06); }
  .rv-header::after  { content:''; position:absolute; bottom:-20px; left:30%; width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,0.04); }
  .rv-logo { font-family:'Playfair Display',serif; font-size:22px; font-weight:900; color:#fff; letter-spacing:1px; text-shadow:1px 2px 8px rgba(0,0,0,0.3); }
  .rv-logo span { color:var(--naranja-claro); }
  .rv-btn-back { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); color:#fff; padding:7px 16px; border-radius:20px; font-size:13px; cursor:pointer; font-family:'Lato',sans-serif; transition:all 0.2s; backdrop-filter:blur(4px); }
  .rv-btn-back:hover { background:rgba(255,255,255,0.25); }

  /* ── BANNER ── */
  .rv-banner-deco { background:linear-gradient(135deg,var(--naranja) 0%,var(--naranja-claro) 100%); padding:8px 24px; display:flex; gap:20px; font-size:11px; font-weight:700; color:white; letter-spacing:1px; text-transform:uppercase; overflow:hidden; }

  /* ── LAYOUT ── */
  .rv-main { display:grid; grid-template-columns:1fr 420px; gap:20px; padding:24px; max-width:1400px; margin:0 auto; }
  @media (max-width:960px) { .rv-main { grid-template-columns:1fr; padding:12px; } }

  /* ── MENÚ ── */
  .rv-menu-col { display:flex; flex-direction:column; min-width:0; }
  .rv-cat-tabs { display:flex; gap:4px; background:var(--blanco); border-radius:14px 14px 0 0; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; border:1px solid rgba(230,126,34,0.15); border-bottom:none; padding:8px 8px 0; }
  .rv-cat-tabs::-webkit-scrollbar { display:none; }
  .rv-cat-tab { flex-shrink:0; padding:9px 16px; border:none; background:transparent; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; color:var(--texto-medio); cursor:pointer; border-radius:10px 10px 0 0; border-bottom:3px solid transparent; transition:all 0.18s; white-space:nowrap; -webkit-tap-highlight-color:transparent; }
  .rv-cat-tab:hover  { color:var(--naranja); background:var(--crema); }
  .rv-cat-tab.activo { color:var(--rojo); background:var(--crema); border-bottom-color:var(--rojo); }
  .rv-menu-body { background:var(--blanco); border-radius:0 0 14px 14px; border:1px solid rgba(230,126,34,0.15); border-top:none; padding:16px 0 20px; }
  .rv-cat-seccion { margin-bottom:6px; }
  .rv-cat-titulo { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:var(--marron); padding:0 16px 10px; display:flex; align-items:center; gap:8px; }
  .rv-cat-titulo::after { content:''; flex:1; height:1px; background:linear-gradient(to right,var(--crema-oscuro),transparent); }
  .rv-carrusel { display:flex; gap:12px; padding:4px 16px 10px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; scroll-snap-type:x mandatory; }
  .rv-carrusel::-webkit-scrollbar { display:none; }

  /* ── TARJETA ── */
  .rv-producto-card { flex-shrink:0; width:140px; background:var(--crema); border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(110,44,14,0.08); cursor:pointer; transition:all 0.22s ease; border:2px solid transparent; position:relative; scroll-snap-align:start; -webkit-tap-highlight-color:transparent; }
  .rv-producto-card:hover { transform:translateY(-3px); box-shadow:0 6px 20px rgba(192,57,43,0.18); border-color:var(--naranja); }
  .rv-producto-card:active { transform:scale(0.96); }
  .rv-cant-badge { position:absolute; top:6px; left:6px; background:var(--rojo); color:white; font-size:11px; font-weight:900; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); z-index:1; }
  .rv-producto-img { width:100%; height:96px; object-fit:cover; }
  .rv-producto-img-placeholder { width:100%; height:96px; background:linear-gradient(135deg,var(--crema-oscuro),#e8d5b0); display:flex; align-items:center; justify-content:center; font-size:32px; }
  .rv-producto-info { padding:8px 10px 28px; }
  .rv-producto-nombre { font-family:'Lato',sans-serif; font-weight:700; font-size:12px; color:var(--texto-oscuro); margin-bottom:3px; line-height:1.3; }
  .rv-producto-precio { font-family:'Playfair Display',serif; font-size:15px; font-weight:700; color:var(--rojo); }
  .rv-agregar-btn { position:absolute; bottom:8px; right:8px; background:var(--rojo); color:white; border:none; width:26px; height:26px; border-radius:50%; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s; box-shadow:0 2px 6px rgba(192,57,43,0.4); }
  .rv-agregar-btn:hover { background:var(--rojo-oscuro); }

  /* ── PANEL DERECHO ── */
  .rv-carrito-panel { background:var(--blanco); border-radius:16px; box-shadow:0 4px 24px rgba(110,44,14,0.12); overflow:hidden; display:flex; flex-direction:column; height:fit-content; position:sticky; top:24px; border:1px solid rgba(230,126,34,0.15); }
  .rv-carrito-header { background:linear-gradient(135deg,var(--marron) 0%,var(--texto-oscuro) 100%); padding:14px 20px; color:white; font-family:'Playfair Display',serif; font-size:18px; font-weight:700; display:flex; align-items:center; gap:10px; }
  .rv-carrito-badge { background:var(--naranja); color:white; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; padding:2px 8px; border-radius:12px; margin-left:auto; }

  /* ── TABS PERSONAS ── */
  .rv-personas-tabs { display:flex; align-items:center; gap:0; background:var(--crema); border-bottom:2px solid var(--crema-oscuro); overflow-x:auto; scrollbar-width:none; }
  .rv-personas-tabs::-webkit-scrollbar { display:none; }
  .rv-persona-tab { flex-shrink:0; padding:10px 14px; border:none; background:transparent; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; color:var(--texto-medio); cursor:pointer; border-bottom:3px solid transparent; transition:all 0.18s; white-space:nowrap; position:relative; }
  .rv-persona-tab.activa { color:var(--rojo); border-bottom-color:var(--rojo); background:var(--blanco); }
  .rv-persona-tab:hover:not(.activa) { color:var(--naranja); }
  .rv-persona-tab-badge { display:inline-block; background:var(--naranja); color:white; font-size:10px; font-weight:900; width:16px; height:16px; border-radius:50%; text-align:center; line-height:16px; margin-left:4px; }
  .rv-persona-tab-badge.vacia { background:#ddd; color:#999; }
  .rv-btn-add-persona { flex-shrink:0; margin:6px 8px; padding:6px 12px; background:linear-gradient(135deg,var(--azul),var(--azul-claro)); color:white; border:none; border-radius:20px; font-size:11px; font-weight:700; cursor:pointer; font-family:'Lato',sans-serif; white-space:nowrap; transition:all 0.2s; box-shadow:0 2px 8px rgba(21,101,192,0.3); }
  .rv-btn-add-persona:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(21,101,192,0.4); }
  .rv-btn-del-persona { position:absolute; top:4px; right:2px; background:none; border:none; color:#ccc; font-size:12px; cursor:pointer; padding:0; line-height:1; transition:color 0.2s; }
  .rv-btn-del-persona:hover { color:var(--rojo); }

  /* ── CARRITO ITEMS ── */
  .rv-carrito-items { padding:10px 12px; max-height:220px; overflow-y:auto; }
  .rv-carrito-items::-webkit-scrollbar { width:4px; }
  .rv-carrito-items::-webkit-scrollbar-track { background:var(--crema); }
  .rv-carrito-items::-webkit-scrollbar-thumb { background:var(--naranja); border-radius:4px; }
  .rv-carrito-vacio { text-align:center; color:#aaa; font-size:13px; padding:24px 16px; }
  .rv-carrito-vacio-icon { font-size:36px; display:block; margin-bottom:8px; opacity:0.4; }
  .rv-item-row { display:flex; align-items:flex-start; gap:8px; padding:7px 4px; border-radius:8px; transition:background 0.15s; border-bottom:1px dashed rgba(230,126,34,0.2); }
  .rv-item-row:last-child { border-bottom:none; }
  .rv-item-row:hover { background:var(--crema); }
  .rv-item-info { flex:1; min-width:0; }
  .rv-item-nombre { font-size:13px; font-weight:700; color:var(--texto-oscuro); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .rv-item-cat-tag { font-size:10px; color:var(--naranja); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:1px; }
  .rv-item-precio-unit { font-size:10px; color:var(--texto-medio); margin-top:1px; }
  .rv-item-controles { display:flex; align-items:center; gap:4px; flex-shrink:0; }
  .rv-item-ctrl-btn { background:var(--crema-oscuro); border:none; width:24px; height:24px; border-radius:6px; font-size:15px; font-weight:900; color:var(--marron); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; padding:0; -webkit-tap-highlight-color:transparent; }
  .rv-item-ctrl-btn:hover  { background:var(--naranja); color:white; }
  .rv-item-ctrl-btn:active { transform:scale(0.9); }
  .rv-item-cant { font-size:14px; font-weight:900; color:var(--texto-oscuro); min-width:22px; text-align:center; font-family:'Playfair Display',serif; }
  .rv-item-precio { font-size:13px; font-weight:700; color:var(--rojo); font-family:'Playfair Display',serif; min-width:52px; text-align:right; flex-shrink:0; }
  .rv-item-del { background:none; border:none; color:#ccc; cursor:pointer; font-size:14px; padding:0 2px; transition:color 0.2s; flex-shrink:0; }
  .rv-item-del:hover { color:var(--rojo); }

  /* ── OPCIONES PERSONA ── */
  .rv-persona-opciones { padding:10px 14px; background:var(--crema); border-top:1px solid var(--crema-oscuro); }
  .rv-persona-opciones-titulo { font-size:10px; font-weight:700; color:var(--texto-medio); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .rv-nombre-input { width:100%; padding:8px 12px; border:2px solid var(--crema-oscuro); border-radius:8px; font-family:'Lato',sans-serif; font-size:13px; font-weight:600; color:var(--texto-oscuro); background:var(--blanco); transition:border-color 0.2s; box-sizing:border-box; outline:none; margin-bottom:8px; }
  .rv-nombre-input:focus { border-color:var(--naranja); }
  .rv-nombre-input::placeholder { color:#bbb; font-weight:400; }
  .rv-checkboxes { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
  .rv-checkbox-label { display:flex; align-items:center; gap:6px; cursor:pointer; user-select:none; padding:7px 12px; border-radius:10px; border:2px solid var(--crema-oscuro); background:var(--blanco); transition:all 0.18s; font-size:12px; font-weight:700; color:var(--texto-medio); flex:1; min-width:90px; -webkit-tap-highlight-color:transparent; }
  .rv-checkbox-label:hover { border-color:var(--naranja); color:var(--naranja); }
  .rv-checkbox-label.activo-todo    { border-color:var(--verde-claro); background:#e8f5e9; color:var(--verde); }
  .rv-checkbox-label.activo-llevar  { border-color:var(--naranja); background:#fff3e0; color:var(--marron-claro); }
  .rv-checkbox-label.activo-sin     { border-color:#c62828; background:#ffebee; color:#c62828; }
  .rv-checkbox-label input[type="checkbox"] { display:none; }
  .rv-check-icon { width:16px; height:16px; border-radius:4px; border:2px solid currentColor; display:flex; align-items:center; justify-content:center; font-size:10px; flex-shrink:0; transition:all 0.15s; }
  .rv-checkbox-label.activo-todo .rv-check-icon,
  .rv-checkbox-label.activo-llevar .rv-check-icon,
  .rv-checkbox-label.activo-sin .rv-check-icon { background:currentColor; color:white; }
  .rv-sin-input { width:100%; padding:7px 11px; border:2px solid #ffcdd2; border-radius:8px; font-family:'Lato',sans-serif; font-size:12px; color:var(--texto-oscuro); background:#fff9f9; transition:border-color 0.2s; box-sizing:border-box; outline:none; margin-top:4px; }
  .rv-sin-input:focus { border-color:#c62828; }
  .rv-sin-input::placeholder { color:#f48fb1; font-weight:400; }

  /* ── RESUMEN TOTAL DEL TICKET ── */
  .rv-resumen-ticket { padding:12px 16px; background:var(--crema); border-top:2px solid var(--crema-oscuro); }
  .rv-resumen-titulo { font-size:10px; font-weight:700; color:var(--texto-medio); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .rv-resumen-persona-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--texto-medio); padding:3px 0; }
  .rv-resumen-persona-nombre { font-weight:700; }
  .rv-resumen-persona-subtotal { font-family:'Playfair Display',serif; color:var(--texto-oscuro); font-weight:700; }
  .rv-resumen-persona-vacia { font-style:italic; color:#bbb; font-size:11px; }
  .rv-divider { border:none; border-top:1px dashed rgba(110,44,14,0.2); margin:8px 0; }
  .rv-total-principal { font-family:'Playfair Display',serif; font-size:22px; font-weight:900; color:var(--texto-oscuro); display:flex; justify-content:space-between; align-items:center; margin:4px 0 8px; }
  .rv-total-principal span:last-child { color:var(--rojo); }
  .rv-input-label { font-size:12px; font-weight:700; color:var(--texto-medio); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block; }
  .rv-input { width:100%; padding:10px 14px; border:2px solid var(--crema-oscuro); border-radius:8px; font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--texto-oscuro); background:var(--blanco); transition:border-color 0.2s; box-sizing:border-box; outline:none; }
  .rv-input:focus { border-color:var(--naranja); }
  .rv-cambio-row { display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg,#e8f5e9,#c8e6c9); border-radius:8px; padding:10px 14px; margin-top:10px; }
  .rv-cambio-label { font-size:12px; font-weight:700; color:#2e7d32; text-transform:uppercase; letter-spacing:0.5px; }
  .rv-cambio-valor { font-family:'Playfair Display',serif; font-size:20px; font-weight:900; color:#1b5e20; }

  /* ── BOTÓN CONFIRMAR ── */
  .rv-btn-confirmar { margin:12px 16px 16px; padding:14px; background:linear-gradient(135deg,var(--rojo) 0%,var(--rojo-oscuro) 100%); color:white; border:none; border-radius:12px; font-family:'Playfair Display',serif; font-size:16px; font-weight:700; cursor:pointer; width:calc(100% - 32px); letter-spacing:0.5px; box-shadow:0 4px 16px rgba(192,57,43,0.35); transition:all 0.2s; }
  .rv-btn-confirmar:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(192,57,43,0.45); }
  .rv-btn-confirmar:active  { transform:translateY(0); }
  .rv-btn-confirmar:disabled { background:#ccc; box-shadow:none; cursor:not-allowed; transform:none; }

  /* ── OVERLAY ── */
  .rv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index:9999; }
  .rv-overlay-box { background:white; border-radius:16px; padding:32px 40px; text-align:center; box-shadow:0 8px 32px rgba(0,0,0,0.3); }
  .rv-overlay-icon { font-size:48px; display:block; margin-bottom:12px; animation:spin 1s linear infinite; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .rv-overlay-text { font-family:'Lato',sans-serif; font-size:16px; font-weight:700; color:#333; }

  /* ── MODAL PREVIEW ── */
  .rv-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); display:flex; align-items:flex-end; justify-content:center; z-index:9998; animation:fadeInOverlay 0.2s ease; }
  @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
  .rv-modal { background:white; border-radius:20px 20px 0 0; width:100%; max-width:540px; max-height:92vh; overflow-y:auto; padding-bottom:32px; animation:slideUp 0.28s cubic-bezier(0.34,1.2,0.64,1); }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .rv-modal-handle { width:40px; height:4px; background:#ddd; border-radius:4px; margin:12px auto 0; }
  .rv-modal-header { background:linear-gradient(135deg,var(--marron) 0%,var(--texto-oscuro) 100%); padding:14px 20px; margin-top:8px; display:flex; align-items:center; justify-content:space-between; }
  .rv-modal-titulo { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:white; }
  .rv-modal-folio  { font-family:'Lato',sans-serif; font-size:11px; font-weight:700; color:rgba(255,255,255,0.7); letter-spacing:1px; }

  /* Ticket preview */
  .rv-ticket-preview { font-family:'Courier New',monospace; padding:18px 24px; font-size:13px; color:#222; }
  .rv-ticket-negocio { text-align:center; margin-bottom:10px; }
  .rv-ticket-negocio-nombre { font-size:16px; font-weight:bold; letter-spacing:2px; }
  .rv-ticket-negocio-sub { font-size:11px; color:#444; line-height:1.7; margin-top:2px; }
  .rv-ticket-sep { border:none; border-top:1px dashed #999; margin:8px 0; }
  .rv-ticket-meta { font-size:11px; color:#333; line-height:1.8; margin-bottom:6px; }
  .rv-ticket-badges { display:flex; gap:6px; margin:4px 0 6px; flex-wrap:wrap; }
  .rv-ticket-badge { font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px; }
  .rv-ticket-badge-todo   { background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; }
  .rv-ticket-badge-llevar { background:#fff3e0; color:#e65100; border:1px solid #ffcc80; }
  .rv-ticket-badge-nombre { background:#e3f2fd; color:#1565c0; border:1px solid #90caf9; }
  .rv-ticket-badge-sin    { background:#ffebee; color:#c62828; border:1px solid #ef9a9a; }
  .rv-ticket-persona-header { font-size:12px; font-weight:bold; background:#f5f5f5; padding:4px 6px; border-radius:4px; margin:8px 0 4px; letter-spacing:0.5px; }
  .rv-ticket-tabla { width:100%; border-collapse:collapse; margin-bottom:4px; }
  .rv-ticket-tabla thead th { font-size:10px; text-transform:uppercase; color:#555; border-bottom:1px dashed #999; padding-bottom:4px; }
  .rv-ticket-tabla tbody td { padding:3px 0; font-size:12px; vertical-align:top; }
  .rv-ticket-cat-tag { font-size:10px; color:#666; font-style:italic; display:block; margin-top:1px; }
  .rv-ticket-subtotal-row { display:flex; justify-content:space-between; font-size:11px; color:#555; padding:2px 0 4px; }
  .rv-ticket-total-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0 2px; }
  .rv-ticket-total-label { font-size:14px; font-weight:bold; }
  .rv-ticket-total-valor { font-size:20px; font-weight:bold; }
  .rv-ticket-dinero { display:flex; justify-content:space-between; font-size:12px; color:#333; padding:2px 0; }
  .rv-ticket-cambio { background:#f0f0f0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; margin-top:6px; }
  .rv-ticket-cambio-label { font-size:11px; font-weight:bold; text-transform:uppercase; }
  .rv-ticket-cambio-valor { font-size:18px; font-weight:bold; }
  .rv-ticket-footer { text-align:center; margin-top:12px; font-size:12px; color:#333; }
  .rv-ticket-footer strong { display:block; font-size:13px; letter-spacing:1px; margin-bottom:2px; }

  /* Modal botones */
  .rv-modal-btns { display:flex; gap:12px; padding:0 20px; margin-top:8px; }
  .rv-modal-btn-cancelar { flex:0 0 90px; padding:14px 0; border:2px solid #ddd; border-radius:12px; background:transparent; color:#888; font-family:'Lato',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.18s; }
  .rv-modal-btn-cancelar:hover { border-color:var(--rojo); color:var(--rojo); }
  .rv-modal-btn-imprimir { flex:1; padding:14px 0; border:none; border-radius:12px; background:linear-gradient(135deg,var(--rojo) 0%,var(--rojo-oscuro) 100%); color:white; font-family:'Playfair Display',serif; font-size:16px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(192,57,43,0.35); transition:all 0.18s; }
  .rv-modal-btn-imprimir:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(192,57,43,0.45); }
`;

// ─────────────────────────────────────────────────────────────────────────────
function PantallaVentas() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [recibido, setRecibido] = useState("");
  const [cambio, setCambio] = useState(0);
  const [generando, setGenerando] = useState(false);
  const [catActiva, setCatActiva] = useState(0);
  const [modalTicket, setModalTicket] = useState(false);
  const [folioPreview, setFolioPreview] = useState(null);

  // ── Multi-persona ─────────────────────────────────────────────────────
  const [personas, setPersonas] = useState([nuevaPersona(0)]);
  const [personaActiva, setPersonaActiva] = useState(0); // índice

  // ── Cargar productos ──────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      if (isWeb()) {
        const data = localStorage.getItem("productos");
        setProductos(data ? JSON.parse(data) : []);
      } else {
        const db = getDB();
        const res = await db.query("SELECT * FROM productos");
        setProductos(res?.values || []);
      }
    };
    cargar();
  }, []);

  // ── Total general ─────────────────────────────────────────────────────
  const totalGeneral = personas.reduce(
    (acc, p) => acc + p.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0),
    0,
  );

  const subtotalPersona = (p) =>
    p.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const totalItemsPersona = (p) =>
    p.carrito.reduce((s, i) => s + i.cantidad, 0);

  useEffect(() => {
    setCambio((parseFloat(recibido) || 0) - totalGeneral);
  }, [recibido, totalGeneral]);

  // ── Helpers persona activa ────────────────────────────────────────────
  const actualizarPersona = (idx, cambios) =>
    setPersonas((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...cambios } : p)),
    );

  const agregarAlCarrito = (producto) => {
    setPersonas((prev) =>
      prev.map((p, i) => {
        if (i !== personaActiva) return p;
        const existe = p.carrito.find((c) => c.id === producto.id);
        return {
          ...p,
          carrito: existe
            ? p.carrito.map((c) =>
                c.id === producto.id ? { ...c, cantidad: c.cantidad + 1 } : c,
              )
            : [...p.carrito, { ...producto, cantidad: 1 }],
        };
      }),
    );
  };

  const cambiarCantidad = (id, delta) => {
    setPersonas((prev) =>
      prev.map((p, i) => {
        if (i !== personaActiva) return p;
        return {
          ...p,
          carrito: p.carrito
            .map((c) =>
              c.id === id ? { ...c, cantidad: c.cantidad + delta } : c,
            )
            .filter((c) => c.cantidad > 0),
        };
      }),
    );
  };

  const eliminarDelCarrito = (id) => {
    setPersonas((prev) =>
      prev.map((p, i) => {
        if (i !== personaActiva) return p;
        return { ...p, carrito: p.carrito.filter((c) => c.id !== id) };
      }),
    );
  };

  const cantidadEnCarrito = (id) =>
    personas[personaActiva]?.carrito.find((c) => c.id === id)?.cantidad || 0;

  // ── Gestión personas ──────────────────────────────────────────────────
  const agregarPersona = () => {
    const idx = personas.length;
    setPersonas((prev) => [...prev, nuevaPersona(idx)]);
    setPersonaActiva(idx);
  };

  const eliminarPersona = (idx) => {
    if (personas.length === 1) return;
    setPersonas((prev) => prev.filter((_, i) => i !== idx));
    setPersonaActiva((prev) => Math.min(prev, personas.length - 2));
  };

  // ── Folio ─────────────────────────────────────────────────────────────
  const obtenerSiguienteFolio = async () => {
    if (isWeb()) {
      const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
      return ventas.length > 0 ? ventas[ventas.length - 1].folio + 1 : 0;
    } else {
      const db = getDB();
      const res = await db.query("SELECT MAX(folio) as ultimo FROM ventas");
      const ultimo = res.values[0]?.ultimo;
      return ultimo !== null && ultimo !== undefined ? ultimo + 1 : 0;
    }
  };

  const hayItemsEnTicket = personas.some((p) => p.carrito.length > 0);

  // ── PASO 1: validar y mostrar preview ────────────────────────────────
  const confirmarVenta = async () => {
    if (!hayItemsEnTicket) return alert("Agrega al menos un producto");
    const folio = await obtenerSiguienteFolio();
    setFolioPreview(folio);
    setModalTicket(true);
  };

  // ── PASO 2: guardar + PDF ─────────────────────────────────────────────
  const confirmarImpresion = async () => {
    setModalTicket(false);
    const folio = folioPreview;
    const fecha = new Date().toISOString();
    const carritoCompleto = personas.flatMap((p) => p.carrito);

    if (isWeb()) {
      let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
      ventas.push({
        id: Date.now(),
        folio,
        total: totalGeneral,
        fecha,
        detalle: carritoCompleto,
      });
      localStorage.setItem("ventas", JSON.stringify(ventas));
    } else {
      const db = getDB();
      const result = await db.run(
        "INSERT INTO ventas (folio, total, fecha) VALUES (?,?,?)",
        [folio, totalGeneral, fecha],
      );
      const ventaId = result.changes?.lastId;
      for (let item of carritoCompleto) {
        await db.run(
          `INSERT INTO detalle_venta (venta_id,producto_id,nombre,precio,cantidad,categoria) VALUES (?,?,?,?,?,?)`,
          [
            ventaId,
            item.id,
            item.nombre,
            item.precio,
            item.cantidad,
            item.categoria ?? 1,
          ],
        );
      }
    }

    setGenerando(true);
    try {
      await generarPDF(folio);
    } finally {
      setGenerando(false);
    }

    setPersonas([nuevaPersona(0)]);
    setPersonaActiva(0);
    setRecibido("");
    setCambio(0);
    setFolioPreview(null);
  };

  // ── Helper base64 ─────────────────────────────────────────────────────
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

  // ── Generar PDF multi-persona ─────────────────────────────────────────
  const generarPDF = async (folio) => {
    const fecha = new Date();
    const fechaTexto = fecha.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const personasConItems = personas.filter((p) => p.carrito.length > 0);
    const totalItems = personasConItems.reduce(
      (s, p) => s + p.carrito.length,
      0,
    );
    const extraLineas = personasConItems.reduce(
      (s, p) =>
        s +
        (p.nombre ? 1 : 0) +
        (p.conTodo || p.paraLlevar ? 1 : 0) +
        (p.sinIngredientes && p.ingredientesSin ? 1 : 0),
      0,
    );

    const alturaBase =
      130 + (personasConItems.length > 1 ? personasConItems.length * 8 : 0);
    const alturaItems = totalItems * 14 + extraLineas * 6;
    const alturaTotal = alturaBase + alturaItems;

    const doc = new jsPDF({ unit: "mm", format: [80, alturaTotal] });
    let y = 8;

    // Logo
    try {
      const logoBase64 = await cargarImagenBase64("/assets/tacos.png");
      doc.addImage(logoBase64, "PNG", (80 - 28) / 2, y, 28, 28);
      y += 32;
    } catch {
      y += 4;
    }

    // Cabecera negocio
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("TACOS RIVERA", 40, y, { align: "center" });
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("C. Bahia de Sta. Barbara 367, Anáhuac I Secc,", 40, y, {
      align: "center",
    });
    y += 4;
    doc.text("Miguel Hidalgo, 11320 Ciudad de México, CDMX", 40, y, {
      align: "center",
    });
    y += 4;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(5, y, 75, y);
    y += 5;

    // Folio + fecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`FOLIO #${String(folio).padStart(9, "0")}`, 5, y);
    doc.text(fechaTexto, 75, y, { align: "right" });
    y += 6;

    doc.setLineWidth(0.4);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);
    doc.setLineDashPattern([], 0);
    y += 5;

    // ── Secciones por persona ──────────────────────────────────────────
    personasConItems.forEach((persona, idx) => {
      const etiqueta = persona.nombre.trim()
        ? persona.nombre.trim().toUpperCase()
        : `PERSONA ${idx + 1}`;

      // Encabezado persona (solo si hay más de 1)
      if (personasConItems.length > 1) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(240, 240, 240);
        doc.rect(5, y - 4, 70, 7, "F");
        doc.text(`▶ ${etiqueta}`, 6, y);
        y += 5;
      }

      // Opciones persona
      const opcs = [
        persona.conTodo && "CON TODO",
        persona.paraLlevar && "PARA LLEVAR",
      ].filter(Boolean);
      if (opcs.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(opcs.join("  |  "), 40, y, { align: "center" });
        y += 5;
      }

      // Sin ingredientes
      if (persona.sinIngredientes && persona.ingredientesSin.trim()) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`SIN: ${persona.ingredientesSin.trim().toUpperCase()}`, 5, y);
        y += 15;
      }

      // Items
      persona.carrito.forEach((item) => {
        const nombre =
          item.nombre.length > 24
            ? item.nombre.substring(0, 22) + ".."
            : item.nombre;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(0, 0, 0);
        doc.text(nombre, 5, y);
        doc.text(`$${(item.precio * item.cantidad).toFixed(2)}`, 75, y, {
          align: "right",
        });
        y += 5;
        const sub = `${getNombreCategoria(item.categoria)}  ×${item.cantidad}  $${item.precio.toFixed(2)} c/u`;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(sub, 5, y);
        y += 10;
      });

      // Subtotal persona (si hay más de 1)
      if (personasConItems.length > 1) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        doc.text(`Subtotal ${etiqueta}:`, 5, y);
        doc.text(`$${subtotalPersona(persona).toFixed(2)}`, 75, y, {
          align: "right",
        });
        y += 5;
        doc.setLineWidth(0.3);
        doc.setLineDashPattern([0.8, 0.8], 0);
        doc.line(5, y, 75, y);
        doc.setLineDashPattern([], 0);
        y += 5;
      }
    });

    // TOTAL
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(5, y, 75, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("TOTAL", 5, y);
    doc.text(`$${totalGeneral.toFixed(2)}`, 75, y, { align: "right" });
    y += 9;

    // Efectivo / Cambio
    if (parseFloat(recibido) > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Efectivo:", 5, y);
      doc.text(`$${parseFloat(recibido).toFixed(2)}`, 75, y, {
        align: "right",
      });
      y += 5.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Cambio:", 5, y);
      doc.text(`$${Math.max(cambio, 0).toFixed(2)}`, 75, y, { align: "right" });
      y += 9;
    } else {
      y += 3;
    }

    // Footer
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);
    doc.setLineDashPattern([], 0);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("¡GRACIAS POR SU COMPRA!", 40, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("¡Vuelva pronto!", 40, y, { align: "center" });

    // Exportar
    const pdfBase64 = doc.output("datauristring").split(",")[1];
    const nombreArchivo = `ticket_${String(folio).padStart(9, "0")}.pdf`;
    try {
      const archivo = await Filesystem.writeFile({
        path: nombreArchivo,
        data: pdfBase64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: `Ticket Folio ${String(folio).padStart(9, "0")}`,
        text: `Ticket · Total: $${totalGeneral.toFixed(2)}`,
        url: archivo.uri,
        dialogTitle: "Imprimir o guardar ticket...",
      });
    } catch {
      window.open(URL.createObjectURL(doc.output("blob")), "_blank");
    }
  };

  // ── Datos para render ─────────────────────────────────────────────────
  const catsConProductos = CATEGORIAS.filter((cat) =>
    productos.some((p) => (p.categoria || 1) === cat.id),
  );
  const gruposCategorias =
    catActiva === 0
      ? catsConProductos.map((cat) => ({
          ...cat,
          items: productos.filter((p) => (p.categoria || 1) === cat.id),
        }))
      : [
          {
            ...CATEGORIAS.find((c) => c.id === catActiva),
            items: productos.filter((p) => (p.categoria || 1) === catActiva),
          },
        ];

  const pa = personas[personaActiva] || personas[0];

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="rv-app">
        {/* Overlay generando */}
        {generando && (
          <div className="rv-overlay">
            <div className="rv-overlay-box">
              <span className="rv-overlay-icon">⚙️</span>
              <div className="rv-overlay-text">Generando ticket…</div>
            </div>
          </div>
        )}

        {/* ── MODAL PREVIEW ── */}
        {modalTicket && (
          <div
            className="rv-modal-overlay"
            onClick={() => setModalTicket(false)}
          >
            <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rv-modal-handle" />
              <div className="rv-modal-header">
                <span className="rv-modal-titulo">
                  🧾 Vista previa del ticket
                </span>
                <span className="rv-modal-folio">
                  #{String(folioPreview).padStart(9, "0")}
                </span>
              </div>

              <div className="rv-ticket-preview">
                <div className="rv-ticket-negocio">
                  <div style={{ marginBottom: 4 }}>
                    <img src={logo} alt="taco" width="72" height="72" />
                  </div>
                  <div className="rv-ticket-negocio-nombre">TACOS RIVERA</div>
                  <div className="rv-ticket-negocio-sub">
                    C. Bahía de Sta. Bárbara 367 #123
                    <br />
                    Anáhuac I Secc, Miguel Hidalgo, CDMX
                  </div>
                </div>
                <hr className="rv-ticket-sep" />
                <div className="rv-ticket-meta">
                  <div>
                    FOLIO:{" "}
                    <strong>#{String(folioPreview).padStart(9, "0")}</strong>
                  </div>
                  <div>FECHA: {new Date().toLocaleString("es-MX")}</div>
                </div>
                <hr className="rv-ticket-sep" />

                {/* Items por persona */}
                {personas
                  .filter((p) => p.carrito.length > 0)
                  .map((persona, idx, arr) => (
                    <div key={persona.id}>
                      {arr.length > 1 && (
                        <div className="rv-ticket-persona-header">
                          👤 {persona.nombre.trim() || `Persona ${idx + 1}`}
                        </div>
                      )}

                      {(persona.nombre.trim() ||
                        persona.conTodo ||
                        persona.paraLlevar ||
                        (persona.sinIngredientes &&
                          persona.ingredientesSin)) && (
                        <div className="rv-ticket-badges">
                          {persona.nombre.trim() && arr.length === 1 && (
                            <span className="rv-ticket-badge rv-ticket-badge-nombre">
                              👤 {persona.nombre.trim()}
                            </span>
                          )}
                          {persona.conTodo && (
                            <span className="rv-ticket-badge rv-ticket-badge-todo">
                              ✓ Con todo
                            </span>
                          )}
                          {persona.paraLlevar && (
                            <span className="rv-ticket-badge rv-ticket-badge-llevar">
                              🥡 Para llevar
                            </span>
                          )}
                          {persona.sinIngredientes &&
                            persona.ingredientesSin && (
                              <span className="rv-ticket-badge rv-ticket-badge-sin">
                                🚫 Sin: {persona.ingredientesSin}
                              </span>
                            )}
                        </div>
                      )}

                      <table className="rv-ticket-tabla">
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left" }}>Producto</th>
                            <th style={{ textAlign: "center" }}>Cant</th>
                            <th style={{ textAlign: "right" }}>Importe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {persona.carrito.map((item) => (
                            <tr key={item.id}>
                              <td>
                                {item.nombre}
                                <span className="rv-ticket-cat-tag">
                                  {getNombreCategoria(item.categoria)} · $
                                  {item.precio.toFixed(2)} c/u
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                x{item.cantidad}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                ${(item.precio * item.cantidad).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {arr.length > 1 && (
                        <div className="rv-ticket-subtotal-row">
                          <span>Subtotal</span>
                          <span>
                            <strong>
                              ${subtotalPersona(persona).toFixed(2)}
                            </strong>
                          </span>
                        </div>
                      )}
                      {idx < arr.length - 1 && <hr className="rv-ticket-sep" />}
                    </div>
                  ))}

                <hr className="rv-ticket-sep" />
                <div className="rv-ticket-total-row">
                  <span className="rv-ticket-total-label">TOTAL</span>
                  <span className="rv-ticket-total-valor">
                    ${totalGeneral.toFixed(2)}
                  </span>
                </div>
                {parseFloat(recibido) > 0 && (
                  <>
                    <div className="rv-ticket-dinero">
                      <span>Recibido:</span>
                      <span>${parseFloat(recibido).toFixed(2)}</span>
                    </div>
                    <div className="rv-ticket-cambio">
                      <span className="rv-ticket-cambio-label">Cambio</span>
                      <span className="rv-ticket-cambio-valor">
                        ${Math.max(cambio, 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <hr className="rv-ticket-sep" />
                <div className="rv-ticket-footer">
                  <strong>¡GRACIAS POR SU COMPRA!</strong>
                  ¡Vuelva pronto! 🌮
                </div>
              </div>

              <div className="rv-modal-btns">
                <button
                  className="rv-modal-btn-cancelar"
                  onClick={() => setModalTicket(false)}
                >
                  ✕ Cancelar
                </button>
                <button
                  className="rv-modal-btn-imprimir"
                  onClick={confirmarImpresion}
                >
                  🖨️ Confirmar e Imprimir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="rv-header">
          <button className="rv-btn-back" onClick={() => navigate("/")}>
            ← Regresar
          </button>
          <div className="rv-logo">
            🌮 Tacos <span>Rivera</span>
          </div>
          <div style={{ width: 90 }} />
        </div>

        {/* Banner */}
        <div className="rv-banner-deco">
          {[
            "✦ Bienvenido",
            "✦ Orden del día",
            "✦ Sabor auténtico",
            "✦ Servicio rápido",
            "✦ Bienvenido",
            "✦ Orden del día",
          ].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>

        <div className="rv-main">
          {/* ── MENÚ ── */}
          <div className="rv-menu-col">
            <div className="rv-cat-tabs">
              <button
                className={`rv-cat-tab ${catActiva === 0 ? "activo" : ""}`}
                onClick={() => setCatActiva(0)}
              >
                🍽️ Todo
              </button>
              {catsConProductos.map((cat) => (
                <button
                  key={cat.id}
                  className={`rv-cat-tab ${catActiva === cat.id ? "activo" : ""}`}
                  onClick={() => setCatActiva(cat.id)}
                >
                  {cat.emoji} {cat.nombre}
                </button>
              ))}
            </div>
            <div className="rv-menu-body">
              {productos.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#aaa",
                    padding: "40px",
                    fontFamily: "Lato,sans-serif",
                  }}
                >
                  No hay productos disponibles
                </div>
              ) : (
                gruposCategorias.map((grupo) => (
                  <div key={grupo.id} className="rv-cat-seccion">
                    {catActiva === 0 && (
                      <div className="rv-cat-titulo">
                        {grupo.emoji} {grupo.nombre}
                      </div>
                    )}
                    <div className="rv-carrusel">
                      {grupo.items.map((p) => {
                        const cant = cantidadEnCarrito(p.id);
                        return (
                          <div
                            key={p.id}
                            className="rv-producto-card"
                            onClick={() => agregarAlCarrito(p)}
                          >
                            {cant > 0 && (
                              <div className="rv-cant-badge">{cant}</div>
                            )}
                            {p.imagen ? (
                              <img
                                src={p.imagen}
                                className="rv-producto-img"
                                alt={p.nombre}
                              />
                            ) : (
                              <div className="rv-producto-img-placeholder">
                                {grupo.emoji}
                              </div>
                            )}
                            <div className="rv-producto-info">
                              <div className="rv-producto-nombre">
                                {p.nombre}
                              </div>
                              <div className="rv-producto-precio">
                                ${p.precio.toFixed(2)}
                              </div>
                            </div>
                            <button
                              className="rv-agregar-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                agregarAlCarrito(p);
                              }}
                            >
                              +
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── PANEL ORDEN ── */}
          <div className="rv-carrito-panel">
            {/* Header */}
            <div className="rv-carrito-header">
              🛒 Orden
              {personas.reduce((s, p) => s + totalItemsPersona(p), 0) > 0 && (
                <span className="rv-carrito-badge">
                  {personas.reduce((s, p) => s + totalItemsPersona(p), 0)} items
                </span>
              )}
            </div>

            {/* ── TABS PERSONAS ── */}
            <div className="rv-personas-tabs">
              {personas.map((p, idx) => {
                const items = totalItemsPersona(p);
                return (
                  <button
                    key={p.id}
                    className={`rv-persona-tab ${personaActiva === idx ? "activa" : ""}`}
                    onClick={() => setPersonaActiva(idx)}
                    style={{ paddingRight: personas.length > 1 ? 22 : 14 }}
                  >
                    {p.nombre.trim() || `Persona ${idx + 1}`}
                    <span
                      className={`rv-persona-tab-badge ${items === 0 ? "vacia" : ""}`}
                    >
                      {items}
                    </span>
                    {personas.length > 1 && (
                      <button
                        className="rv-btn-del-persona"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarPersona(idx);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </button>
                );
              })}
              <button className="rv-btn-add-persona" onClick={agregarPersona}>
                + Agregar persona
              </button>
            </div>

            {/* Items de la persona activa */}
            <div className="rv-carrito-items">
              {pa.carrito.length === 0 ? (
                <div className="rv-carrito-vacio">
                  <span className="rv-carrito-vacio-icon">🍽️</span>
                  Agrega platillos del menú
                </div>
              ) : (
                pa.carrito.map((item) => (
                  <div key={item.id} className="rv-item-row">
                    <div className="rv-item-info">
                      <div className="rv-item-nombre">{item.nombre}</div>
                      <div className="rv-item-cat-tag">
                        {getNombreCategoria(item.categoria)}
                      </div>
                      <div className="rv-item-precio-unit">
                        ${item.precio.toFixed(2)} c/u
                      </div>
                    </div>
                    <div className="rv-item-controles">
                      <button
                        className="rv-item-ctrl-btn"
                        onClick={() => cambiarCantidad(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="rv-item-cant">{item.cantidad}</span>
                      <button
                        className="rv-item-ctrl-btn"
                        onClick={() => cambiarCantidad(item.id, +1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="rv-item-precio">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </span>
                    <button
                      className="rv-item-del"
                      onClick={() => eliminarDelCarrito(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ── OPCIONES DE PERSONA ── */}
            <div className="rv-persona-opciones">
              <div className="rv-persona-opciones-titulo">
                📋 Datos de la orden
              </div>

              <input
                type="text"
                className="rv-nombre-input"
                placeholder="👤 Nombre del cliente (opcional)"
                value={pa.nombre}
                onChange={(e) =>
                  actualizarPersona(personaActiva, { nombre: e.target.value })
                }
                maxLength={30}
              />

              <div className="rv-checkboxes">
                <label
                  className={`rv-checkbox-label ${pa.conTodo ? "activo-todo" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={pa.conTodo}
                    onChange={(e) =>
                      actualizarPersona(personaActiva, {
                        conTodo: e.target.checked,
                      })
                    }
                  />
                  <span className="rv-check-icon">{pa.conTodo ? "✓" : ""}</span>
                  Con todo
                </label>
                <label
                  className={`rv-checkbox-label ${pa.paraLlevar ? "activo-llevar" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={pa.paraLlevar}
                    onChange={(e) =>
                      actualizarPersona(personaActiva, {
                        paraLlevar: e.target.checked,
                      })
                    }
                  />
                  <span className="rv-check-icon">
                    {pa.paraLlevar ? "✓" : ""}
                  </span>
                  🥡 Para llevar
                </label>
                <label
                  className={`rv-checkbox-label ${pa.sinIngredientes ? "activo-sin" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={pa.sinIngredientes}
                    onChange={(e) =>
                      actualizarPersona(personaActiva, {
                        sinIngredientes: e.target.checked,
                        ingredientesSin: e.target.checked
                          ? pa.ingredientesSin
                          : "",
                      })
                    }
                  />
                  <span className="rv-check-icon">
                    {pa.sinIngredientes ? "✓" : ""}
                  </span>
                  🚫 Sin:
                </label>
              </div>

              {pa.sinIngredientes && (
                <input
                  type="text"
                  className="rv-sin-input"
                  placeholder="Ej: cebolla, cilantro, chile..."
                  value={pa.ingredientesSin}
                  onChange={(e) =>
                    actualizarPersona(personaActiva, {
                      ingredientesSin: e.target.value,
                    })
                  }
                  maxLength={60}
                  autoFocus
                />
              )}
            </div>

            {/* ── RESUMEN TOTAL ── */}
            <div className="rv-resumen-ticket">
              {personas.length > 1 && (
                <>
                  <div className="rv-resumen-titulo">🧾 Resumen del ticket</div>
                  {personas.map((p, idx) => (
                    <div key={p.id} className="rv-resumen-persona-row">
                      <span className="rv-resumen-persona-nombre">
                        {p.nombre.trim() || `Persona ${idx + 1}`}
                      </span>
                      {p.carrito.length === 0 ? (
                        <span className="rv-resumen-persona-vacia">
                          sin items
                        </span>
                      ) : (
                        <span className="rv-resumen-persona-subtotal">
                          ${subtotalPersona(p).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                  <hr className="rv-divider" />
                </>
              )}

              <div className="rv-total-principal">
                <span>Total</span>
                <span>${totalGeneral.toFixed(2)}</span>
              </div>
              <hr className="rv-divider" />
              <label className="rv-input-label">💵 Efectivo recibido</label>
              <input
                type="number"
                className="rv-input"
                value={recibido}
                onChange={(e) => setRecibido(e.target.value)}
                placeholder="$0.00"
              />
              {parseFloat(recibido) > 0 && (
                <div className="rv-cambio-row">
                  <span className="rv-cambio-label">💚 Cambio</span>
                  <span className="rv-cambio-valor">
                    ${Math.max(cambio, 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <button
              className="rv-btn-confirmar"
              onClick={confirmarVenta}
              disabled={!hayItemsEnTicket || generando}
            >
              {generando
                ? "⏳ Generando ticket..."
                : `✓ Confirmar Orden · $${totalGeneral.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PantallaVentas;
