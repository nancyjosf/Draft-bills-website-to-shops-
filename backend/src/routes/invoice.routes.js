const express = require("express");
const {
  listInvoices,
  createInvoice,
  generateInvoicePdfById,
  generateInvoicePdf,
  deleteInvoice,
} = require("../controllers/invoice.controller");

const router = express.Router();

router.get("/", listInvoices);
router.post("/", createInvoice);
router.get("/:id/pdf", generateInvoicePdfById);
router.delete("/:id", deleteInvoice);
router.post("/pdf", generateInvoicePdf);

module.exports = router;
