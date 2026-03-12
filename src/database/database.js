import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";

const isNative = Capacitor.isNativePlatform();

let sqlite;
let db;

export const initDB = async () => {
  if (isNative) {
    // ── ANDROID ───────────────────────────────────────────────────────
    sqlite = new SQLiteConnection(CapacitorSQLite);

    db = await sqlite.createConnection(
      "taqueria_db",
      false,
      "no-encryption",
      1,
      false,
    );

    await db.open();

    // ── Tabla productos ───────────────────────────────────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre    TEXT    NOT NULL,
        precio    REAL    NOT NULL,
        imagen    TEXT    DEFAULT '',
        categoria INTEGER DEFAULT 1
      );
    `);

    // Migración: columna categoria en productos
    try {
      await db.execute(
        `ALTER TABLE productos ADD COLUMN categoria INTEGER DEFAULT 1;`
      );
      console.log("Migración OK: columna 'categoria' agregada a productos");
    } catch (_) {
      // Columna ya existía — ignorar
    }

    // ── Tabla ventas ──────────────────────────────────────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        folio  INTEGER,
        total  REAL NOT NULL,
        fecha  TEXT NOT NULL
      );
    `);

    // ── Tabla detalle_venta ───────────────────────────────────────────
    // Instalaciones nuevas: ya incluye columna categoria
    await db.execute(`
      CREATE TABLE IF NOT EXISTS detalle_venta (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id    INTEGER,
        producto_id INTEGER,
        nombre      TEXT,
        precio      REAL,
        cantidad    INTEGER,
        categoria   INTEGER DEFAULT 1
      );
    `);

    // Migración: agrega columna categoria a detalle_venta si no existe
    try {
      await db.execute(
        `ALTER TABLE detalle_venta ADD COLUMN categoria INTEGER DEFAULT 1;`
      );
      console.log("Migración OK: columna 'categoria' agregada a detalle_venta");
    } catch (_) {
      // Columna ya existía — ignorar
    }

    console.log("✅ SQLite inicializado (Android)");

  } else {
    // ── WEB — localStorage ────────────────────────────────────────────

    // Migración productos: asignar categoria = 1 si no la tenían
    try {
      const raw = localStorage.getItem("productos");
      if (raw) {
        const lista = JSON.parse(raw);
        const migrada = lista.map((p) => ({
          ...p,
          categoria: p.categoria ?? 1,
        }));
        localStorage.setItem("productos", JSON.stringify(migrada));
      }
    } catch (e) {
      console.warn("Migración web productos omitida:", e);
    }

    // Migración ventas: asignar categoria = 1 en detalle si no la tenían
    try {
      const raw = localStorage.getItem("ventas");
      if (raw) {
        const ventas = JSON.parse(raw);
        const migradas = ventas.map((v) => ({
          ...v,
          detalle: (v.detalle || []).map((d) => ({
            ...d,
            categoria: d.categoria ?? 1,
          })),
        }));
        localStorage.setItem("ventas", JSON.stringify(migradas));
      }
    } catch (e) {
      console.warn("Migración web ventas omitida:", e);
    }

    console.log("✅ Modo Web — usando localStorage");
  }
};

export const isWeb = () => !isNative;
export const getDB = () => db;