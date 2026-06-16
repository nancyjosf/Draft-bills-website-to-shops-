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
    _id = "",
  } = invoice;
  const fontPath = getArabicFontPath();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 30 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Set font once at the beginning if available
      if (fontPath) {
        try {
          doc.font(fontPath);
        } catch (err) {
          console.warn(
            "Failed to load Arabic font, using default:",
            err.message,
          );
        }
      }

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const contentLeft = doc.page.margins.left;
      const contentRight = doc.page.width - doc.page.margins.right;

      // === HEADER (Title Line) ===
      doc.fontSize(26).fillColor("#000000");
      // Right side: اسم المحل
      doc.text("اسم المحل", contentLeft, 30, {
        width: pageWidth,
        align: "right",
      });
      // Left side: فاتورة (positioned absolutely on the same line)
      doc.fontSize(26).text("فاتورة", contentLeft, 30, {
        width: pageWidth,
        align: "left",
      });

      // === INFO SECTION (Two boxes) ===
      const infoY = 90;
      const boxWidth = (pageWidth - 15) / 2;
      const boxHeight = 65;

      // Right box: Customer Details
      doc
        .lineWidth(1.5)
        .strokeColor("#000000")
        .rect(contentLeft + boxWidth + 15, infoY, boxWidth, boxHeight)
        .stroke();
      doc.fontSize(11).fillColor("#000000");
      doc.text(
        `اسم العميل: ${rtlText(customerName || "---")}`,
        contentLeft + boxWidth + 20,
        infoY + 8,
        {
          width: boxWidth - 10,
          align: "right",
        },
      );
      doc.text(
        `رقم الهاتف: ${ltrText(String(customerPhone || "0"))}`,
        contentLeft + boxWidth + 20,
        infoY + 32,
        {
          width: boxWidth - 10,
          align: "right",
        },
      );

      // Left box: Invoice Number & Date
      doc
        .lineWidth(1.5)
        .strokeColor("#000000")
        .rect(contentLeft, infoY, boxWidth, boxHeight)
        .stroke();
      doc.fontSize(11).fillColor("#000000");
      doc.text(
        `رقم الفاتورة: ${ltrText(String(_id || "جديدة"))}`,
        contentLeft + 5,
        infoY + 8,
        {
          width: boxWidth - 10,
          align: "right",
        },
      );
      doc.text(`التاريخ: ${formatDate(date)}`, contentLeft + 5, infoY + 32, {
        width: boxWidth - 10,
        align: "right",
      });

      // === TABLE SECTION ===
      const tableY = infoY + boxHeight + 25;
      const tableHeaderHeight = 28;
      const tableRowHeight = 28;
      const columnWidths = [45, 180, 60, 60, 70]; // #, Product, Quantity, Price, Total
      const columnLabels = ["م", "اسم المنتج", "الكمية", "السعر", "الإجمالي"];

      // Draw table header
      let colX = contentLeft;
      doc.lineWidth(1.5).fillColor("#000000");

      columnWidths.forEach((width, idx) => {
        // Header cell background (black)
        doc
          .rect(colX, tableY, width, tableHeaderHeight)
          .fillAndStroke("#000000", "#000000");

        // Header text (white)
        doc.fillColor("#ffffff").fontSize(11);
        const label = columnLabels[idx];
        doc.text(label, colX + 2, tableY + 8, {
          width: width - 4,
          align: "center",
        });

        colX += width;
      });

      // Draw table rows
      let currentTableY = tableY + tableHeaderHeight;
      doc.fillColor("#000000").fontSize(10);

      items.forEach((item, index) => {
        const lineTotal = item.price * item.quantity;
        const rowData = [
          String(index + 1),
          escapeHtml(item.name),
          String(item.quantity),
          formatCurrency(item.price),
          formatCurrency(lineTotal),
        ];

        colX = contentLeft;
        columnWidths.forEach((width, idx) => {
          // Draw cell border
          doc
            .lineWidth(1)
            .rect(colX, currentTableY, width, tableRowHeight)
            .stroke("#000000");

          // Draw cell text
          doc.fontSize(10).fillColor("#000000");
          const cellText = rowData[idx];
          doc.text(cellText, colX + 2, currentTableY + 8, {
            width: width - 4,
            align: "center",
          });

          colX += width;
        });

        currentTableY += tableRowHeight;
      });

      // === SUMMARY SECTION ===
      const summaryY = currentTableY + 25;
      const summaryBoxWidth = 220;
      const summaryBoxHeight = 80;

      // Summary box border
      doc
        .lineWidth(1.5)
        .strokeColor("#000000")
        .rect(contentLeft, summaryY, summaryBoxWidth, summaryBoxHeight)
        .stroke();

      const summaryLineHeight = 25;
      let summaryItemY = summaryY + 5;

      // Total line (bold with border separator)
      doc
        .lineWidth(2)
        .moveTo(contentLeft + 5, summaryItemY + 22)
        .lineTo(contentLeft + summaryBoxWidth - 5, summaryItemY + 22)
        .stroke("#000000");

      doc.fontSize(13).fillColor("#000000");
      doc.text("الإجمالي:", contentLeft + 5, summaryItemY, {
        width: summaryBoxWidth - 10,
        align: "right",
      });
      doc.text(formatCurrency(total), contentLeft + 5, summaryItemY, {
        width: summaryBoxWidth - 10,
        align: "left",
      });

      summaryItemY += summaryLineHeight;

      // Paid line
      doc.fontSize(11).fillColor("#000000");
      doc.text("المدفوع:", contentLeft + 5, summaryItemY, {
        width: summaryBoxWidth - 10,
        align: "right",
      });
      doc.text(formatCurrency(paid), contentLeft + 5, summaryItemY, {
        width: summaryBoxWidth - 10,
        align: "left",
      });

      summaryItemY += summaryLineHeight;

      // Remaining line
      doc.text("المتبقي:", contentLeft + 5, summaryItemY, {
        width: summaryBoxWidth - 10,
        align: "right",
      });
      doc.text(formatCurrency(remaining), contentLeft + 5, summaryItemY, {
        width: summaryBoxWidth - 10,
        align: "left",
      });

      // === FOOTER ===
      doc.fontSize(11).fillColor("#000000");
      doc.text("شكراً لتعاملكم معنا", contentLeft, doc.page.height - 45, {
        width: pageWidth,
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePdfBuffer,
};
