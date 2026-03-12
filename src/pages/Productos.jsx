import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDB, isWeb } from "../database/database";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

// ── Categorías disponibles ─────────────────────────────────────────────────
const CATEGORIAS = [
  { id: 1, nombre: "Tacos", emoji: "🌮" },
  { id: 2, nombre: "Tortas", emoji: "🥪" },
  { id: 3, nombre: "Gorditas", emoji: "🫓" },
  { id: 4, nombre: "Gringas", emoji: "🫔" },
  { id: 5, nombre: "Volcanes", emoji: "🌋" },
  { id: 6, nombre: "Burritos", emoji: "🌯" },
  { id: 7, nombre: "Especiales", emoji: "🌮" },
  { id: 8, nombre: "Bebidas", emoji: "🥤" },
  { id: 9, nombre: "carnitas", emoji: "🐖" },
];

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
  }

  .pd-app {
    font-family: 'Lato', sans-serif;
    min-height: 100vh;
    background-color: var(--crema);
    background-image:
      radial-gradient(ellipse at top left, rgba(192,57,43,0.06) 0%, transparent 55%),
      radial-gradient(ellipse at bottom right, rgba(230,126,34,0.08) 0%, transparent 55%);
  }
/*filtro por categoría*/
/* ── FILTRO CATEGORÍAS EN GRID ── */

body {
  overflow-x: hidden; /* 🔥 evita que la app se estire */
}

.pd-cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 🔥 4 iguales */
  gap: 10px;

  padding: 12px;
  background: var(--blanco);
  border-bottom: 2px solid var(--crema-oscuro);

  width: 100%;
  box-sizing: border-box;
}

/* BOTONES IGUALES */
.pd-cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  height: 50px;               /* 🔥 todos mismo alto */
  width: 100%;                /* 🔥 mismo ancho */
  border-radius: 14px;

  border: 2px solid var(--crema-oscuro);
  background: var(--blanco);

  font-family: 'Lato', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--texto-medio);

  cursor: pointer;
  transition: all 0.2s ease;
}

.pd-cat-item span {
  margin-top: 4px;
  font-size: 11px;
}

.pd-cat-item small {
  font-size: 10px;
  opacity: 0.7;
}

/* HOVER */
.pd-cat-item:hover {
  border-color: var(--naranja);
  color: var(--naranja);
}

/* ACTIVO */
.pd-cat-item.activo {
  background: var(--rojo);
  color: var(--blanco);
  border-color: var(--rojo);
}

  /* ── HEADER ── */
  .pd-header {
    background: linear-gradient(135deg, var(--marron) 0%, var(--texto-oscuro) 100%);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(44,24,16,0.35);
    position: relative;
    overflow: hidden;
  }

  .pd-header::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 140px; height: 140px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }

  .pd-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .pd-btn-back {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.22);
    color: #fff;
    padding: 7px 16px;
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    font-family: 'Lato', sans-serif;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
    white-space: nowrap;
  }

  .pd-btn-back:hover { background: rgba(255,255,255,0.22); }

  .pd-header-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 8px rgba(0,0,0,0.3);
  }

  .pd-header-title span { color: var(--naranja-claro); }

  .pd-header-count {
    background: var(--naranja);
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    font-family: 'Lato', sans-serif;
  }


  /* ── BODY ── */
  .pd-body {
    padding: 24px;
    max-width: 1100px;
    margin: 0 auto;
  }

  /* ── FORMULARIO ── */
  .pd-form-card {
    background: var(--blanco);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(110,44,14,0.1);
    border: 1px solid rgba(230,126,34,0.15);
    overflow: hidden;
    margin-bottom: 28px;
  }

  .pd-form-header {
    background: linear-gradient(135deg, var(--naranja) 0%, var(--naranja-claro) 100%);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pd-form-header-title {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  .pd-form-body {
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 600px) {
    .pd-form-body { grid-template-columns: 1fr; }
  }

  .pd-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pd-form-group.full { grid-column: 1 / -1; }

  .pd-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--texto-medio);
  }

  .pd-input {
    padding: 11px 14px;
    border: 2px solid var(--crema-oscuro);
    border-radius: 10px;
    font-family: 'Lato', sans-serif;
    font-size: 15px;
    color: var(--texto-oscuro);
    background: var(--crema);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    box-sizing: border-box;
  }

  .pd-input:focus {
    border-color: var(--naranja);
    box-shadow: 0 0 0 3px rgba(230,126,34,0.12);
    background: var(--blanco);
  }

  /* ── SELECT CATEGORÍA ── */
  .pd-select {
    padding: 11px 14px;
    border: 2px solid var(--crema-oscuro);
    border-radius: 10px;
    font-family: 'Lato', sans-serif;
    font-size: 15px;
    color: var(--texto-oscuro);
    background: var(--crema);
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235D4037' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
    cursor: pointer;
  }

  .pd-select:focus {
    border-color: var(--naranja);
    box-shadow: 0 0 0 3px rgba(230,126,34,0.12);
    background-color: var(--blanco);
  }

  /* ── SELECTOR DE IMAGEN ── */
  .pd-imagen-section {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pd-imagen-preview-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .pd-img-preview {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    object-fit: cover;
    border: 2px solid var(--crema-oscuro);
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .pd-img-placeholder {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    background: var(--crema-oscuro);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    flex-shrink: 0;
    border: 2px dashed #c8a96e;
  }

  /* Botones de fuente de imagen */
  .pd-img-btns {
    display: flex;
    gap: 10px;
    flex: 1;
    flex-wrap: wrap;
  }

  .pd-btn-camara {
    flex: 1;
    min-width: 120px;
    padding: 12px 10px;
    border: 2px solid var(--naranja);
    border-radius: 10px;
    background: transparent;
    color: var(--naranja);
    font-family: 'Lato', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    -webkit-tap-highlight-color: transparent;
  }

  .pd-btn-camara:hover,
  .pd-btn-camara:active {
    background: var(--naranja);
    color: white;
  }

  .pd-btn-galeria {
    flex: 1;
    min-width: 120px;
    padding: 12px 10px;
    border: 2px solid var(--marron-claro);
    border-radius: 10px;
    background: transparent;
    color: var(--marron-claro);
    font-family: 'Lato', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    -webkit-tap-highlight-color: transparent;
  }

  .pd-btn-galeria:hover,
  .pd-btn-galeria:active {
    background: var(--marron-claro);
    color: white;
  }

  /* Fallback input file (web) */
  .pd-input-file-wrap {
    position: relative;
    flex: 1;
  }

  .pd-input-file {
    padding: 11px 14px;
    border: 2px dashed var(--crema-oscuro);
    border-radius: 10px;
    font-family: 'Lato', sans-serif;
    font-size: 13px;
    color: var(--texto-medio);
    background: var(--crema);
    cursor: pointer;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
  }

  .pd-input-file:hover { border-color: var(--naranja); }

  .pd-btn-quitar-img {
    background: none;
    border: none;
    color: #bbb;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    font-family: 'Lato', sans-serif;
    transition: color 0.15s;
    align-self: flex-start;
    margin-top: 2px;
  }

  .pd-btn-quitar-img:hover { color: var(--rojo); }

  /* ── ACCIONES FORMULARIO ── */
  .pd-form-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 4px;
  }

  .pd-btn-cancelar {
    padding: 11px 22px;
    border: 2px solid var(--crema-oscuro);
    border-radius: 10px;
    background: transparent;
    color: var(--texto-medio);
    font-family: 'Lato', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pd-btn-cancelar:hover { border-color: var(--rojo); color: var(--rojo); }

  .pd-btn-guardar {
    padding: 11px 28px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--verde) 0%, var(--verde-claro) 100%);
    color: white;
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 3px 12px rgba(30,107,60,0.3);
    letter-spacing: 0.3px;
  }

  .pd-btn-guardar:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(30,107,60,0.4);
  }

  .pd-btn-guardar.editar {
    background: linear-gradient(135deg, var(--naranja) 0%, var(--naranja-claro) 100%);
    box-shadow: 0 3px 12px rgba(230,126,34,0.3);
  }

  .pd-btn-guardar.editar:hover {
    box-shadow: 0 6px 18px rgba(230,126,34,0.4);
  }

  /* ── SECCIÓN LABEL ── */
  .pd-section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--marron);
    opacity: 0.6;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pd-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--crema-oscuro), transparent);
  }

  /* ── GRID PRODUCTOS ── */
  .pd-productos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 16px;
  }

  .pd-producto-card {
    background: var(--blanco);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(110,44,14,0.09);
    border: 2px solid transparent;
    transition: all 0.22s ease;
    display: flex;
    flex-direction: column;
  }

  .pd-producto-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(110,44,14,0.15);
    border-color: var(--crema-oscuro);
  }

  .pd-producto-card.editando {
    border-color: var(--naranja);
    box-shadow: 0 4px 20px rgba(230,126,34,0.25);
  }

  .pd-producto-img {
    width: 100%;
    height: 110px;
    object-fit: cover;
  }

  .pd-producto-img-ph {
    width: 100%;
    height: 110px;
    background: linear-gradient(135deg, var(--crema-oscuro), #e8d5b0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
  }

  .pd-producto-info {
    padding: 12px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* Badge de categoría en la tarjeta */
  .pd-cat-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    background: var(--crema-oscuro);
    color: var(--marron-claro);
    padding: 2px 8px;
    border-radius: 20px;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .pd-producto-nombre {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--texto-oscuro);
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .pd-producto-precio {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 900;
    color: var(--rojo);
    margin-bottom: 12px;
  }

  .pd-producto-acciones {
    display: flex;
    gap: 8px;
    margin-top: auto;
  }

  .pd-btn-editar {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #1A3A5C, #2980B9);
    color: white;
    font-family: 'Lato', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    box-shadow: 0 2px 6px rgba(26,58,92,0.25);
  }

  .pd-btn-editar:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(26,58,92,0.35);
  }

  .pd-btn-eliminar {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--rojo-oscuro), var(--rojo));
    color: white;
    font-family: 'Lato', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    box-shadow: 0 2px 6px rgba(192,57,43,0.25);
  }

  .pd-btn-eliminar:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(192,57,43,0.35);
  }

  /* ── EMPTY STATE ── */
  .pd-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--texto-medio);
    opacity: 0.5;
    grid-column: 1 / -1;
  }

  .pd-empty-icon { font-size: 52px; display: block; margin-bottom: 12px; }
  .pd-empty-text { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
  .pd-empty-sub  { font-size: 13px; margin-top: 4px; }

  /* ── BANNER EDITANDO ── */
  .pd-editing-banner {
    background: linear-gradient(135deg, var(--naranja), var(--naranja-claro));
    color: white;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

function Productos() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState("");
  const [categoria, setCategoria] = useState(1); // id numérico
  const [editandoId, setEditandoId] = useState(null);
  const [filtrocat, setFiltroCat] = useState(0); // 0 = todas

  // ── BD ────────────────────────────────────────────────────────────────
  const cargarProductos = async () => {
    if (isWeb()) {
      const data = localStorage.getItem("productos");
      setProductos(data ? JSON.parse(data) : []);
    } else {
      const db = getDB();
      const res = await db.query("SELECT * FROM productos");
      setProductos(res?.values || []);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // ── Guardar / actualizar ──────────────────────────────────────────────
  const agregarProducto = async () => {
    if (!nombre || !precio) return alert("Completa nombre y precio");
    const productoData = {
      nombre,
      precio: parseFloat(precio),
      imagen,
      categoria: parseInt(categoria),
    };

    if (isWeb()) {
      let lista = [...productos];
      if (editandoId) {
        lista = lista.map((p) =>
          p.id === editandoId ? { ...p, ...productoData } : p,
        );
      } else {
        lista.push({ id: Date.now(), ...productoData });
      }
      localStorage.setItem("productos", JSON.stringify(lista));
      setProductos(lista);
    } else {
      const db = getDB();
      if (editandoId) {
        await db.run(
          "UPDATE productos SET nombre=?, precio=?, imagen=?, categoria=? WHERE id=?",
          [nombre, parseFloat(precio), imagen, parseInt(categoria), editandoId],
        );
      } else {
        await db.run(
          "INSERT INTO productos (nombre, precio, imagen, categoria) VALUES (?,?,?,?)",
          [nombre, parseFloat(precio), imagen, parseInt(categoria)],
        );
      }
      cargarProductos();
    }

    cancelarEdicion();
  };

  const editarProducto = (producto) => {
    setNombre(producto.nombre);
    setPrecio(producto.precio);
    setImagen(producto.imagen || "");
    setCategoria(producto.categoria || 1);
    setEditandoId(producto.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicion = () => {
    setNombre("");
    setPrecio("");
    setImagen("");
    setCategoria(1);
    setEditandoId(null);
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    if (isWeb()) {
      const filtrados = productos.filter((p) => p.id !== id);
      localStorage.setItem("productos", JSON.stringify(filtrados));
      setProductos(filtrados);
    } else {
      const db = getDB();
      await db.run("DELETE FROM productos WHERE id=?", [id]);
      cargarProductos();
    }
    if (editandoId === id) cancelarEdicion();
  };

  // ── Imagen — cámara nativa (Capacitor) ───────────────────────────────
  const tomarFoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // base64 data URL
        source: CameraSource.Camera, // cámara trasera
      });
      setImagen(photo.dataUrl);
    } catch (e) {
      // usuario canceló o sin permisos — no mostrar error
      console.log("Cámara cancelada:", e);
    }
  };

  // ── Imagen — galería nativa (Capacitor) ──────────────────────────────
  const elegirDeGaleria = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // galería
      });
      setImagen(photo.dataUrl);
    } catch (e) {
      console.log("Galería cancelada:", e);
    }
  };

  // ── Imagen — fallback web (input file) ───────────────────────────────
  const manejarImagenWeb = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Filtrado por categoría ─────────────────────────────────────────────
  const productosFiltrados =
    filtrocat === 0
      ? productos
      : productos.filter((p) => p.categoria === filtrocat);

  const nombreCategoria = (id) =>
    CATEGORIAS.find((c) => c.id === id)?.nombre || "";

  const emojiCategoria = (id) =>
    CATEGORIAS.find((c) => c.id === id)?.emoji || "🍽️";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="pd-app">
        {/* Header */}
        <div className="pd-header">
          <div className="pd-header-left">
            <button className="pd-btn-back" onClick={() => navigate("/")}>
              ← Regresar
            </button>
            <div className="pd-header-title">
              🌮 Gestión de <span>Productos</span>
            </div>
          </div>
          <div className="pd-header-count">{productos.length} productos</div>
        </div>

        {/* Banner edición activa */}
        {editandoId && (
          <div className="pd-editing-banner">
            ✏️ Editando producto — realiza los cambios y guarda
          </div>
        )}

        <div className="pd-body">
          {/* ── Formulario ── */}
          <div className="pd-form-card">
            <div className="pd-form-header">
              <span style={{ fontSize: 20 }}>{editandoId ? "✏️" : "➕"}</span>
              <div className="pd-form-header-title">
                {editandoId ? "Editar Producto" : "Nuevo Producto"}
              </div>
            </div>

            <div className="pd-form-body">
              {/* Nombre */}
              <div className="pd-form-group">
                <label className="pd-label">Nombre del platillo</label>
                <input
                  type="text"
                  className="pd-input"
                  placeholder="Ej: Taco de Pastor"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              {/* Precio */}
              <div className="pd-form-group">
                <label className="pd-label">Precio ($)</label>
                <input
                  type="number"
                  className="pd-input"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>

              {/* Categoría */}
              <div className="pd-form-group full">
                <label className="pd-label">Categoría</label>
                <select
                  className="pd-select"
                  value={categoria}
                  onChange={(e) => setCategoria(parseInt(e.target.value))}
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Imagen */}
              <div className="pd-imagen-section">
                <label className="pd-label">Imagen del producto</label>
                <div className="pd-imagen-preview-wrap">
                  {/* Vista previa */}
                  {imagen ? (
                    <img
                      src={imagen}
                      className="pd-img-preview"
                      alt="preview"
                    />
                  ) : (
                    <div className="pd-img-placeholder">🍽️</div>
                  )}

                  {/* Botones cámara/galería para Android nativo */}
                  {!isWeb() ? (
                    <div className="pd-img-btns">
                      <button className="pd-btn-camara" onClick={tomarFoto}>
                        📷 Cámara
                      </button>
                      <button
                        className="pd-btn-galeria"
                        onClick={elegirDeGaleria}
                      >
                        🖼️ Galería
                      </button>
                      {imagen && (
                        <button
                          className="pd-btn-quitar-img"
                          onClick={() => setImagen("")}
                        >
                          ✕ Quitar
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Fallback web: input file normal */
                    <div className="pd-img-btns">
                      <input
                        type="file"
                        accept="image/*"
                        className="pd-input-file"
                        onChange={manejarImagenWeb}
                      />
                      {imagen && (
                        <button
                          className="pd-btn-quitar-img"
                          onClick={() => setImagen("")}
                        >
                          ✕ Quitar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="pd-form-actions">
                {editandoId && (
                  <button className="pd-btn-cancelar" onClick={cancelarEdicion}>
                    Cancelar
                  </button>
                )}
                <button
                  className={`pd-btn-guardar ${editandoId ? "editar" : ""}`}
                  onClick={agregarProducto}
                >
                  {editandoId ? "✓ Actualizar Producto" : "✓ Agregar Producto"}
                </button>
              </div>
            </div>
          </div>
          {/* ── Filtro por categoría en cuadrícula ── */}
          <div className="pd-cat-grid">
            <button
              className={`pd-cat-item ${filtrocat === 0 ? "activo" : ""}`}
              onClick={() => setFiltroCat(0)}
            >
              🍽️
              <span>Todos</span>
              <small>{productos.length}</small>
            </button>

            {CATEGORIAS.map((cat) => {
              const count = productos.filter(
                (p) => p.categoria === cat.id,
              ).length;

              return (
                <button
                  key={cat.id}
                  className={`pd-cat-item ${filtrocat === cat.id ? "activo" : ""}`}
                  onClick={() => setFiltroCat(cat.id)}
                >
                  {cat.emoji}
                  <span>{cat.nombre}</span>
                  <small>{count}</small>
                </button>
              );
            })}
          </div>

          {/* ── Lista de productos ── */}
          <div className="pd-section-label">
            {filtrocat === 0
              ? "Todos los productos"
              : `${emojiCategoria(filtrocat)} ${nombreCategoria(filtrocat)}`}
          </div>

          <div className="pd-productos-grid">
            {productosFiltrados.length === 0 ? (
              <div className="pd-empty">
                <span className="pd-empty-icon">🍽️</span>
                <div className="pd-empty-text">Sin productos</div>
                <div className="pd-empty-sub">
                  {filtrocat === 0
                    ? "Agrega tu primer platillo al menú"
                    : `No hay productos en ${nombreCategoria(filtrocat)}`}
                </div>
              </div>
            ) : (
              productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  className={`pd-producto-card ${editandoId === producto.id ? "editando" : ""}`}
                >
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      className="pd-producto-img"
                      alt={producto.nombre}
                    />
                  ) : (
                    <div className="pd-producto-img-ph">
                      {emojiCategoria(producto.categoria)}
                    </div>
                  )}

                  <div className="pd-producto-info">
                    {/* Badge categoría */}
                    <span className="pd-cat-badge">
                      {emojiCategoria(producto.categoria)}{" "}
                      {nombreCategoria(producto.categoria)}
                    </span>

                    <div className="pd-producto-nombre">{producto.nombre}</div>
                    <div className="pd-producto-precio">
                      ${producto.precio.toFixed(2)}
                    </div>

                    <div className="pd-producto-acciones">
                      <button
                        className="pd-btn-editar"
                        onClick={() => editarProducto(producto)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="pd-btn-eliminar"
                        onClick={() => eliminarProducto(producto.id)}
                      >
                        🗑 Borrar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Productos;
