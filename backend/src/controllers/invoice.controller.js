const {
  normalizeItems,
  calculateTotal,
  buildInvoiceItemsFromProducts,
  computePayment,
} = require("../services/invoice.service");
const { generateInvoicePdfBuffer } = require("../utils/pdf.generator");
const productService = require("../services/product.service");
const Invoice = require("../models/invoice.model");

const buildPdfFileName = (invoiceId) => {
  const normalized = String(invoiceId || "invoice").replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  );
  return `invoice-${normalized}.pdf`;
};

const purgeOldInvoices = async () => {
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - 3);
  await Invoice.deleteMany({ date: { $lt: threshold } });
};

const buildInvoicePayload = async (payload = {}) => {
  const requestedItems = normalizeItems(payload.items || []);
  const customerName = String(payload.customerName || "").trim();
  const customerPhone = String(payload.customerPhone || "0").trim() || "0";
  const paidAmount = Number(payload.paidAmount ?? payload.paid ?? 0);

  if (!customerName) {
    return { error: "اسم المشتري مطلوب" };
  }

  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    return { error: "المبلغ المدفوع يجب أن يكون رقمًا أكبر من أو يساوي 0" };
  }

  if (!requestedItems.length) {
    return { error: "الفاتورة يجب أن تحتوي على منتج واحد على الأقل" };
  }

  const productIds = requestedItems.map((item) => item.productId);
  const products = await productService.findProductsByIds(productIds);
  const items = buildInvoiceItemsFromProducts(products, requestedItems);

  if (!items.length) {
    return { error: "لا توجد منتجات صالحة داخل السلة" };
  }

  const total = calculateTotal(items);
  const payment = computePayment(total, paidAmount);

  return {
    invoice: {
      customerName,
      customerPhone,
      date: new Date(),
      items,
      total,
      ...payment,
    },
  };
};

const listInvoices = async (_req, res) => {
  try {
    await purgeOldInvoices();
    const invoices = await Invoice.find().sort({ date: -1 }).lean();
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({
      message: "فشل تحميل سجل الفواتير",
      error: error.message,
    });
  }
};

const createInvoice = async (req, res) => {
  try {
    await purgeOldInvoices();
    const result = await buildInvoicePayload(req.body || {});
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const savedInvoice = await Invoice.create(result.invoice);
    return res.status(201).json(savedInvoice);
  } catch (error) {
    return res.status(500).json({
      message: "فشل إنشاء الفاتورة",
      error: error.message,
    });
  }
};

const generateInvoicePdfById = async (req, res) => {
  try {
    await purgeOldInvoices();
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    const pdfBuffer = await generateInvoicePdfBuffer(invoice);
    const fileName = buildPdfFileName(invoice._id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      message: "فشل إنشاء ملف الفاتورة",
      error: error.message,
    });
  }
};

const generateInvoicePdf = async (req, res) => {
  try {
    const result = await buildInvoicePayload(req.body || {});
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const pdfBuffer = await generateInvoicePdfBuffer(result.invoice);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=invoice-preview.pdf",
    );
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      message: "فشل إنشاء ملف الفاتورة",
      error: error.message,
    });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    await purgeOldInvoices();
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    return res.json({ message: "تم حذف الفاتورة بنجاح" });
  } catch (error) {
    return res.status(500).json({
      message: "فشل حذف الفاتورة",
      error: error.message,
    });
  }
};

module.exports = {
  listInvoices,
  createInvoice,
  generateInvoicePdfById,
  generateInvoicePdf,
  deleteInvoice,
};
