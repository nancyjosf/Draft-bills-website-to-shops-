const PDFDocument = require("pdfkit");
const fs = require("fs");

const getArabicFontPath = () => {
  const candidates = [
    process.env.PDF_FONT_PATH,
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
  ].filter(Boolean);

  return candidates.find((fontPath) => fs.existsSync(fontPath));
};

const formatCurrency = (value) => {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)} ج.م.`;
};

const formatDate = (value) => {
  return new Date(value).toLocaleString("en-GB-u-nu-latn");
};

const rtlText = (value) => `\u200F${value}`;

const ltrText = (value) => `\u200E${value}`;

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const generateInvoicePdfBuffer = async (invoice) => {
  const {
    customerName = "",
    customerPhone = "0",
    date,
    items = [],
    total = 0,
    paid = 0,
    remaining = 0,
  } = invoice;
  const fontPath = getArabicFontPath();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (fontPath) {
      doc.font(fontPath);
    }

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const contentLeft = doc.page.margins.left;
    const contentRight = doc.page.width - doc.page.margins.right;
    const fieldGap = 14;
    const fieldWidth = (pageWidth - fieldGap) / 2;

    const drawField = (x, y, width, label, value) => {
      doc.lineWidth(1).strokeColor("#000000").rect(x, y, width, 44).stroke();

      doc
        .fillColor("#000000")
        .fontSize(10)
        .text(rtlText(label), x + 10, y + 6, {
          width: width - 20,
          align: "right",
        });

      doc
        .fillColor("#000000")
        .fontSize(12)
        .text(rtlText(value), x + 10, y + 20, {
          width: width - 20,
          align: "right",
        });
    };

    doc
      .fillColor("#000000")
      .fontSize(26)
      .text(rtlText("فاتورة"), doc.page.margins.left, 40, {
        align: "right",
      });

    doc.moveDown(0.7);
    doc.fontSize(12).fillColor("#000000");

    const firstRowY = doc.y + 8;
    drawField(
      contentRight - fieldWidth,
      firstRowY,
      fieldWidth,
      "رقم الفاتورة",
      ltrText(String(invoice._id || "")),
    );
    drawField(contentLeft, firstRowY, fieldWidth, "اسم المشتري", customerName);
    drawField(
      contentRight - fieldWidth,
      firstRowY + 54,
      fieldWidth,
      "تاريخ الإصدار",
      formatDate(date),
    );
    drawField(
      contentLeft,
      firstRowY + 54,
      fieldWidth,
      "رقم الهاتف",
      ltrText(String(customerPhone || "0")),
    );

    const headerTop = firstRowY + 120;
    const columns = [
      { key: "total", label: "الإجمالي", width: 80 },
      { key: "price", label: "السعر", width: 80 },
      { key: "quantity", label: "الكمية", width: 70 },
      { key: "name", label: "المنتج", width: 250 },
      { key: "index", label: "#", width: 50 },
    ];
    const rowHeight = 28;

    let runningX = contentRight;
    const columnX = columns.map((column) => {
      runningX -= column.width;
      return runningX;
    });

    doc.fillColor("#000000").fontSize(11);
    columns.forEach((column, index) => {
      doc
        .rect(columnX[index], headerTop, column.width, rowHeight)
        .fillAndStroke("#000000", "#000000");
      doc
        .fillColor("#ffffff")
        .text(rtlText(column.label), columnX[index], headerTop + 8, {
          width: column.width,
          align: "center",
        });
    });

    let currentY = headerTop + rowHeight;
    items.forEach((item, index) => {
      const lineTotal = item.price * item.quantity;
      const cells = {
        total: ltrText(formatCurrency(lineTotal)),
        price: ltrText(formatCurrency(item.price)),
        quantity: ltrText(String(item.quantity)),
        name: rtlText(escapeHtml(item.name)),
        index: ltrText(String(index + 1)),
      };

      columns.forEach((column, cellIndex) => {
        doc
          .rect(columnX[cellIndex], currentY, column.width, rowHeight)
          .stroke("#000000");
        doc
          .fillColor("#000000")
          .text(cells[column.key], columnX[cellIndex] + 4, currentY + 8, {
            width: column.width - 8,
            align: column.key === "name" ? "right" : "center",
          });
      });

      currentY += rowHeight;
    });

    const drawSummaryLine = (label, value, y) => {
      doc
        .fontSize(14)
        .fillColor("#000000")
        .text(rtlText(label), contentRight - 200, y, {
          width: 200,
          align: "right",
        });

      doc
        .fontSize(14)
        .fillColor("#000000")
        .text(ltrText(value), contentLeft, y, {
          width: 200,
          align: "left",
        });
    };

    const summaryY = currentY + 30;
    drawSummaryLine("الإجمالي:", `ج.م ${Number(total).toFixed(2)}`, summaryY);
    drawSummaryLine(
      "المدفوع:",
      `ج.م ${Number(paid).toFixed(2)}`,
      summaryY + 25,
    );
    drawSummaryLine(
      "المتبقي:",
      `ج.م ${Number(remaining).toFixed(2)}`,
      summaryY + 50,
    );

    doc
      .moveTo(contentLeft, summaryY - 5)
      .lineTo(contentRight, summaryY - 5)
      .strokeColor("#000000")
      .stroke();

    doc.end();
  });
};

module.exports = {
  generateInvoicePdfBuffer,
};
