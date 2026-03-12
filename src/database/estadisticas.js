import { getDB, isWeb } from "./database";

/**
 * Retorna platillos vendidos con cantidad, órdenes e ingresos.
 *
 * @param {number} categoria   0 = todas las categorías
 * @param {number} dias        DEPRECADO — se mantiene por compatibilidad (usar fechaInicio/fechaFin)
 * @param {string} fechaInicio "YYYY-MM-DD" — inclusive
 * @param {string} fechaFin   "YYYY-MM-DD" — inclusive
 */
export const getPlatillosVendidos = async (
  categoria   = 0,
  dias        = 0,          // compatibilidad con versión anterior
  fechaInicio = null,
  fechaFin    = null,
) => {

  if (!isWeb()) {
    // ── ANDROID / SQLite ─────────────────────────────────────────────────
    const db = getDB();

    const conditions = [];
    const params     = [];

    if (categoria !== 0) {
      conditions.push("dv.categoria = ?");
      params.push(categoria);
    }

    // Prioridad: fechaInicio/fechaFin explícitas; si no, usar `dias`
    if (fechaInicio) {
      conditions.push("DATE(v.fecha) >= ?");
      params.push(fechaInicio);
    } else if (dias !== 0) {
      conditions.push("DATE(v.fecha) >= DATE('now', ?)");
      params.push(`-${dias} days`);
    }

    if (fechaFin) {
      conditions.push("DATE(v.fecha) <= ?");
      params.push(fechaFin);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        dv.nombre                         AS nombre,
        SUM(dv.cantidad)                  AS total_cantidad,
        COUNT(DISTINCT dv.venta_id)       AS total_ordenes,
        ROUND(SUM(dv.precio * dv.cantidad), 2) AS total_ingresos
      FROM detalle_venta dv
      INNER JOIN ventas v ON v.id = dv.venta_id
      ${where}
      GROUP BY dv.nombre
      ORDER BY total_cantidad DESC
    `;

    const res = await db.query(query, params);
    return res.values || [];

  } else {
    // ── WEB / localStorage ───────────────────────────────────────────────
    const ventas = JSON.parse(localStorage.getItem("ventas")) || [];

    // Rango de fechas
    let tsInicio = null;
    let tsFin    = null;

    if (fechaInicio) {
      tsInicio = new Date(fechaInicio + "T00:00:00").getTime();
    } else if (dias !== 0) {
      const d = new Date();
      d.setDate(d.getDate() - dias);
      d.setHours(0, 0, 0, 0);
      tsInicio = d.getTime();
    }

    if (fechaFin) {
      tsFin = new Date(fechaFin + "T23:59:59").getTime();
    }

    const conteo = {};

    ventas.forEach((v) => {
      const tsVenta = new Date(v.fecha).getTime();
      if (tsInicio && tsVenta < tsInicio) return;
      if (tsFin    && tsVenta > tsFin)    return;

      (v.detalle || []).forEach((d) => {
        if (categoria !== 0 && d.categoria !== categoria) return;

        if (!conteo[d.nombre]) {
          conteo[d.nombre] = {
            nombre:         d.nombre,
            total_cantidad: 0,
            total_ordenes:  0,
            total_ingresos: 0,
          };
        }

        conteo[d.nombre].total_cantidad += d.cantidad;
        conteo[d.nombre].total_ordenes  += 1;
        conteo[d.nombre].total_ingresos += (d.precio || 0) * d.cantidad;
      });
    });

    return Object.values(conteo).sort(
      (a, b) => b.total_cantidad - a.total_cantidad
    );
  }
};