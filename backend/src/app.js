const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const invoiceRoutes = require("./routes/invoice.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/products", productRoutes);
app.use("/invoice", invoiceRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
