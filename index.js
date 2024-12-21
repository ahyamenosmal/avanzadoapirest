const express = require("express");
const morgan = require("morgan");
const pool = require("./db/db");
const joyasRouter = require("./routes/joyas");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/joyas", joyasRouter);

app.use((req, res, next) => {
  console.log(`Consulta a la ruta: ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Bienvenido a My Precious API");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
