const express = require("express");
const pool = require("../db/db"); // Aquí se importa la conexión a la base de datos
const format = require("pg-format");
const router = express.Router();

const obtenerJoyas = async ({
  limits = 10,
  order_by = "stock_ASC",
  page = 1,
}) => {
  try {
    const [campo, direccion] = order_by.split("_");
    const offset = Math.abs((page - 1) * limits);

    const formattedQuery = format(
      "SELECT * FROM inventario ORDER BY %I %s LIMIT %L OFFSET %L",
      campo,
      direccion,
      limits,
      offset
    );

    const { rows: joyas } = await pool.query(formattedQuery);
    return joyas;
  } catch (error) {
    throw new Error("No se pudo obtener las joyas");
  }
};

const obtenerStockTotal = async () => {
  try {
    const result = await pool.query("SELECT SUM(stock) FROM inventario");
    return result.rows[0].sum;
  } catch (error) {
    throw new Error("No se pudo obtener el stock total");
  }
};

const obtenerTotalJoyas = async () => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM inventario");
    return result.rows[0].count;
  } catch (error) {
    throw new Error("No se pudo obtener el total de joyas");
  }
};

router.get("/", async (req, res) => {
  try {
    const { limits = 10, order_by = "stock_ASC", page = 1 } = req.query;

    const joyas = await obtenerJoyas({ limits, order_by, page });
    const stockTotal = await obtenerStockTotal();
    const totalJoyas = await obtenerTotalJoyas();

    res.json({
      totalJoyas,
      stockTotal,
      results: joyas,
      links: {
        self: `http://localhost:3000/joyas?page=${page}&limits=${limits}&order_by=${order_by}`,
      },
    });
  } catch (err) {
    console.error("Error al obtener las joyas", err);
    res.status(500).send("Error del servidor");
  }
});

const obtenerJoyasPorFiltros = async ({
  precio_min,
  precio_max,
  categoria,
  metal,
}) => {
  try {
    let filtros = [];
    let values = [];

    const agregarFiltro = (campo, comparador, valor) => {
      values.push(valor);
      filtros.push(`${campo} ${comparador} $${filtros.length + 1}`);
    };

    if (precio_min) {
      agregarFiltro("precio", ">=", precio_min);
    }

    if (precio_max) {
      agregarFiltro("precio", "<=", precio_max);
    }

    if (categoria) {
      agregarFiltro("categoria", "=", categoria);
    }

    if (metal) {
      agregarFiltro("metal", "=", metal);
    }

    let consulta = "SELECT * FROM inventario";
    if (filtros.length > 0) {
      consulta += ` WHERE ${filtros.join(" AND ")}`;
    }

    const result = await pool.query(consulta, values);
    return result.rows;
  } catch (error) {
    throw new Error("No se pudo encontrar las joyas con los filtros");
  }
};

router.get("/filtros", async (req, res) => {
  try {
    const { precio_min, precio_max, categoria, metal } = req.query;

    const joyas = await obtenerJoyasPorFiltros({
      precio_min,
      precio_max,
      categoria,
      metal,
    });

    if (joyas.length === 0) {
      return res
        .status(404)
        .json({
          message: "No se encontraron joyas con los filtros proporcionados.",
        });
    }

    res.json(joyas);
  } catch (err) {
    console.error("Error al aplicar los filtros", err);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;
