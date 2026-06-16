import { Injectable } from "@angular/core";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { InvoiceResponse } from "./invoice.service";

@Injectable({ providedIn: "root" })
export class InvoicePdfExportService {
	async exportInvoice(invoice: InvoiceResponse, fileName: string): Promise<void> {
		const element = this.createInvoiceElement(invoice);
		document.body.appendChild(element);

		try {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

			if (document.fonts?.ready) {
				await document.fonts.ready;
			}

			const canvas = await html2canvas(element, {
				scale: 3,
				useCORS: true,
				backgroundColor: "#ffffff",
				logging: false,
				windowWidth: element.scrollWidth,
				windowHeight: element.scrollHeight,
			});

			const pdf = new jsPDF("p", "mm", "a4");
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const imgWidth = pageWidth;
			const imgHeight = (canvas.height * imgWidth) / canvas.width;
			const imageData = canvas.toDataURL("image/png");

			let renderedHeight = 0;
			let position = 0;

			pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
			renderedHeight = imgHeight;

			while (renderedHeight > pageHeight) {
				position -= pageHeight;
				pdf.addPage();
				pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
				renderedHeight -= pageHeight;
			}

			pdf.save(fileName);
		} finally {
			element.remove();
		}
	}

	private createInvoiceElement(invoice: InvoiceResponse): HTMLDivElement {
		const wrapper = document.createElement("div");
		wrapper.dir = "rtl";
		wrapper.lang = "ar";
		wrapper.style.position = "fixed";
		wrapper.style.left = "-10000px";
		wrapper.style.top = "0";
		wrapper.style.width = "210mm";
		wrapper.style.background = "#ffffff";
		wrapper.style.color = "#000000";
		wrapper.style.zIndex = "9999";
		wrapper.style.pointerEvents = "none";
		wrapper.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, sans-serif";

		const itemsRows = (invoice.items || [])
			.map((item, index) => {
				const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
				return `
					<tr>
						<td>${index + 1}</td>
						<td>${this.escapeHtml(item.name || "")}</td>
						<td>${this.formatNumber(item.quantity)}</td>
						<td>${this.formatMoney(Number(item.price || 0))}</td>
						<td>${this.formatMoney(lineTotal)}</td>
					</tr>`;
			})
			.join("");

		wrapper.innerHTML = `
			<style>
				* {
					box-sizing: border-box;
				}

				.invoice-container {
					width: 210mm;
					min-height: 297mm;
					padding: 20px;
					margin: 0;
					background: #ffffff;
					color: #000000;
					direction: rtl;
					text-align: right;
					font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
				}

				.invoice-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 28px;
					gap: 16px;
				}

				.store-name,
				.invoice-title {
					font-size: 28px;
					font-weight: 700;
					line-height: 1;
				}

				.invoice-info {
					display: flex;
					justify-content: space-between;
					gap: 14px;
					margin-bottom: 24px;
				}

				.info-box {
					width: calc(50% - 7px);
					border: 1.5px solid #000000;
					padding: 14px 16px;
					line-height: 1.9;
					font-size: 18px;
				}

				.invoice-table {
					width: 100%;
					border-collapse: collapse;
					table-layout: fixed;
					margin: 20px 0 28px;
				}

				.invoice-table th,
				.invoice-table td {
					border: 1px solid #000000;
					padding: 12px 10px;
					text-align: center;
					vertical-align: middle;
					font-size: 16px;
					white-space: nowrap;
				}

				.invoice-table th {
					background: #000000;
					color: #ffffff;
					font-weight: 700;
				}

				.invoice-summary {
					width: 420px;
					margin-left: auto;
					border: 1.5px solid #000000;
					border-radius: 5px;
					padding: 14px 16px;
				}

				.summary-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: 12px;
					margin-bottom: 12px;
					font-size: 18px;
					line-height: 1.5;
				}

				.summary-item span:first-child {
					font-weight: 700;
				}

				.total-item {
					font-weight: 700;
					padding-bottom: 10px;
					margin-bottom: 10px;
					border-bottom: 2px solid #000000;
				}

				.invoice-footer {
					margin-top: 38px;
					text-align: center;
					font-size: 18px;
					color: #000000;
				}
			</style>

			<div class="invoice-container">
				<div class="invoice-header">
					<div class="store-name">اسم المحل</div>
					<div class="invoice-title">فاتورة</div>
				</div>

				<div class="invoice-info">
					<div class="info-box">
						<div>اسم العميل: ${this.escapeHtml(invoice.customerName || "---")}</div>
						<div>رقم الهاتف: ${this.escapeHtml(String(invoice.customerPhone || "0"))}</div>
					</div>
					<div class="info-box">
						<div>رقم الفاتورة: ${this.escapeHtml(String(invoice._id || "جديدة"))}</div>
						<div>التاريخ: ${this.formatDate(invoice.date)}</div>
					</div>
				</div>

				<table class="invoice-table">
					<thead>
						<tr>
							<th style="width: 8%;">م</th>
							<th style="width: 38%;">اسم المنتج</th>
							<th style="width: 12%;">الكمية</th>
							<th style="width: 20%;">السعر</th>
							<th style="width: 22%;">الإجمالي</th>
						</tr>
					</thead>
					<tbody>
						${itemsRows}
					</tbody>
				</table>

				<div class="invoice-summary">
					<div class="summary-item total-item">
						<span>الإجمالي:</span>
						<span>${this.formatMoney(Number(invoice.total || 0))}</span>
					</div>
					<div class="summary-item">
						<span>المدفوع:</span>
						<span>${this.formatMoney(Number(invoice.paid || 0))}</span>
					</div>
					<div class="summary-item" style="margin-bottom: 0;">
						<span>المتبقي:</span>
						<span>${this.formatMoney(Number(invoice.remaining || 0))}</span>
					</div>
				</div>

				<div class="invoice-footer">شكراً لتعاملكم معنا</div>
			</div>
		`;

		return wrapper;
	}

	private formatMoney(value: number): string {
		return `${new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(Number.isFinite(value) ? value : 0)} ج.م.`;
	}

	private formatNumber(value: number | string): string {
		return String(value ?? "");
	}

	private formatDate(value: string | Date): string {
		const date = value instanceof Date ? value : new Date(value);
		return new Intl.DateTimeFormat("en-GB", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	}

	private escapeHtml(value: string): string {
		return String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
}
