import { Component, OnInit } from "@angular/core";
import {
	CartItem,
	InvoicePayload,
	InvoiceResponse,
	InvoiceService,
} from "../../../core/services/invoice.service";
import { InvoiceCartService } from "../../../core/services/invoice-cart.service";
import { finalize, map, switchMap } from "rxjs";

@Component({
	selector: "app-invoice-page",
	template: `
		<div class="invoice-wrapper">
			<!-- Form Section -->
			<section class="panel">
				<h2>الفاتورة</h2>
				<p>أكمل بيانات العميل ثم أصدر الفاتورة من السلة الحالية.</p>
				<p class="feedback loading" *ngIf="isLoading">جاري تنفيذ الطلب...</p>
				<p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
				<p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

				<div class="buyer-grid">
					<label>
						اسم المشتري
						<input type="text" [(ngModel)]="customerName" placeholder="مثال: أحمد محمد" />
					</label>

					<label>
						رقم الهاتف
						<input type="tel" [(ngModel)]="customerPhone" placeholder="مثال: 01000000000" />
					</label>

					<label>
						المبلغ المدفوع
						<input type="number" min="0" step="0.01" [(ngModel)]="paidAmount" placeholder="0.00" />
					</label>
				</div>

				<h3>سلة الفاتورة</h3>
				<table class="table" *ngIf="cartItems.length > 0; else emptyCart">
					<thead>
						<tr>
							<th>المنتج</th>
							<th>السعر</th>
							<th>الكمية</th>
							<th>الإجمالي</th>
							<th>حذف</th>
						</tr>
					</thead>
					<tbody>
						<tr *ngFor="let item of cartItems">
							<td>{{ item.name }}</td>
							<td>{{ item.price | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</td>
							<td>
								<input
									type="number"
									min="1"
									[max]="maxQuantity(item.productId)"
									[(ngModel)]="item.quantity"
									(ngModelChange)="onCartQuantityChange(item)"
								/>
							</td>
							<td>{{ item.price * item.quantity | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</td>
							<td>
								<button class="remove-btn" (click)="removeFromCart(item.productId)">حذف</button>
							</td>
						</tr>
					</tbody>
				</table>

				<ng-template #emptyCart>
					<p class="empty">السلة فارغة. أضف المنتجات من صفحة المنتجات.</p>
				</ng-template>

				<p class="grand-total">الإجمالي الكلي: {{ total() | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</p>
				<p class="grand-total">المبلغ المدفوع: {{ paidAmount | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</p>
				<p class="grand-total">المتبقي: {{ remainingAmount() | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</p>
				<p class="grand-total" *ngIf="changeAmount() > 0">الباقي للعميل: {{ changeAmount() | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</p>

				<div class="actions">
					<button class="export" (click)="completeInvoice()" [disabled]="isLoading">إكمال الفاتورة وتصدير PDF</button>
					<button class="preview-btn" (click)="togglePreview()" [disabled]="!cartItems.length">معاينة الفاتورة</button>
				</div>
				<p class="meta" *ngIf="lastInvoiceDate">وقت آخر فاتورة: {{ lastInvoiceDate | date: 'medium':'':'ar-EG' }}</p>
			</section>

			<!-- Invoice Preview Section -->
			<section class="preview-panel" *ngIf="showPreview">
				<div class="preview-header">
					<h3>معاينة الفاتورة</h3>
					<button class="close-btn" (click)="togglePreview()">✕</button>
				</div>

				<div class="invoice-print" dir="rtl">
					<!-- Header -->
					<div class="invoice-header">
						<div class="store-name">اسم المحل</div>
						<div class="invoice-title">فاتورة</div>
					</div>

					<!-- Info -->
					<div class="invoice-info">
						<div>
							<p>اسم العميل: {{ customerName || 'أحمد محمد' }}</p>
							<p>رقم الهاتف: {{ formatNumberText(customerPhone || '01000000000') }}</p>
						</div>
						<div>
							<p>رقم الفاتورة: جديدة</p>
							<p>التاريخ: {{ formatDateEn(today) }}</p>
						</div>
					</div>

					<!-- Table -->
					<table class="invoice-table" *ngIf="cartItems.length > 0">
						<thead>
							<tr>
								<th>م</th>
								<th>اسم المنتج</th>
								<th>الكمية</th>
								<th>السعر</th>
								<th>الإجمالي</th>
							</tr>
						</thead>
						<tbody>
							<tr *ngFor="let item of cartItems; let i = index">
								<td>{{ formatNumberText(i + 1) }}</td>
								<td>{{ item.name }}</td>
								<td>{{ formatNumberText(item.quantity) }}</td>
								<td>{{ formatMoneyEn(item.price) }}</td>
								<td>{{ formatMoneyEn(item.price * item.quantity) }}</td>
							</tr>
						</tbody>
					</table>

					<!-- Summary -->
					<div class="invoice-summary">
						<div class="summary-item total-item">
							<span>الإجمالي:</span>
							<span>{{ formatMoneyEn(total()) }}</span>
						</div>
						<div class="summary-item">
							<span>المدفوع:</span>
							<span>{{ formatMoneyEn(paidAmount) }}</span>
						</div>
						<div class="summary-item">
							<span>المتبقي:</span>
							<span>{{ formatMoneyEn(remainingAmount()) }}</span>
						</div>
					</div>

					<!-- Footer -->
					<div class="invoice-footer">
						شكراً لتعاملكم معنا
					</div>
				</div>
			</section>
		</div>
	`,
	styles: [
		`
			.invoice-wrapper {
				display: grid;
				grid-template-columns: 1fr;
				gap: 2rem;
			}

			.panel {
				padding: 1.1rem;
				background: var(--surface);
				border-radius: 14px;
				border: 1px solid rgba(40, 28, 89, 0.14);
			}

			h2 {
				margin: 0;
				color: var(--color-navy);
			}

			p {
				margin: 0.45rem 0 1rem;
				color: var(--color-teal);
			}

			.feedback {
				margin: 0.5rem 0 0.9rem;
				padding: 0.55rem 0.75rem;
				border-radius: 8px;
				font-size: 0.9rem;
			}

			.loading {
				background: rgba(78, 141, 156, 0.12);
				color: var(--color-teal);
			}

			.success {
				background: rgba(133, 199, 154, 0.2);
				color: #1f5b2f;
			}

			.error {
				background: rgba(179, 57, 81, 0.16);
				color: #8f1731;
			}

			.table {
				width: 100%;
				border-collapse: collapse;
				margin-bottom: 1.2rem;
			}

			h3 {
				margin: 1rem 0 0.6rem;
				color: var(--color-navy);
			}

			.buyer-grid {
				display: grid;
				grid-template-columns: repeat(2, minmax(180px, 1fr));
				gap: 0.8rem;
				margin-bottom: 1rem;
			}

			label {
				display: grid;
				gap: 0.35rem;
				font-weight: 700;
				color: var(--color-navy);
			}

			th {
				background: rgba(133, 199, 154, 0.28);
			}

			th,
			td {
				border-bottom: 1px solid rgba(78, 141, 156, 0.25);
				padding: 0.65rem;
				text-align: right;
			}

			input {
				width: 100%;
				max-width: 130px;
				padding: 0.42rem;
				border-radius: 8px;
				border: 1px solid rgba(40, 28, 89, 0.24);
			}

			.buyer-grid input {
				max-width: 100%;
			}

			.grand-total {
				font-weight: 700;
				color: var(--color-navy);
			}

			button {
				padding: 0.55rem 1rem;
				border-radius: 10px;
				border: none;
				font-weight: 700;
				cursor: pointer;
				transition: all 0.3s ease;
			}

			.actions {
				display: flex;
				gap: 1rem;
				margin-top: 1rem;
			}

			.export {
				background: var(--color-teal);
				color: #fff;
				flex: 1;
			}

			.preview-btn {
				background: #9c27b0;
				color: #fff;
				flex: 1;
			}

			.export:hover:not(:disabled) {
				opacity: 0.9;
			}

			.preview-btn:hover:not(:disabled) {
				opacity: 0.9;
			}

			button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			.remove-btn {
				background: var(--danger);
				color: #fff;
			}

			.empty,
			.meta {
				color: var(--color-teal);
				margin-top: 0.6rem;
			}

			/* Invoice Preview Styles */
			.preview-panel {
				background: var(--surface);
				border-radius: 14px;
				border: 1px solid rgba(40, 28, 89, 0.14);
				padding: 1.5rem;
			}

			.preview-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 1.5rem;
				border-bottom: 2px solid rgba(40, 28, 89, 0.14);
				padding-bottom: 1rem;
			}

			.preview-header h3 {
				margin: 0;
				color: var(--color-navy);
			}

			.close-btn {
				background: none;
				border: none;
				font-size: 1.5rem;
				cursor: pointer;
				color: var(--color-navy);
				padding: 0;
			}

			.invoice-print {
				background: #fff;
				padding: 30px;
				border-radius: 10px;
				box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
				max-width: 800px;
				margin: 0 auto 1.5rem;
				font-family: 'Cairo', sans-serif;
				color: #000;
			}

			.invoice-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 2rem;
			}

			.store-name {
				font-size: 24px;
				font-weight: bold;
				color: #000;
			}

			.invoice-title {
				font-size: 28px;
				font-weight: bold;
				color: #000;
			}

			.invoice-info {
				margin-top: 20px;
				display: flex;
				justify-content: space-between;
				text-align: right;
				margin-bottom: 20px;
			}

			.invoice-info div {
				line-height: 1.8;
				font-size: 0.95rem;
				padding: 15px;
				border: 1px solid #000;
				background: #fff;
				border-radius: 5px;
			}

			.invoice-info p {
				margin: 0;
				color: #000;
			}

			.invoice-table {
				width: 100%;
				border-collapse: collapse;
				margin-top: 20px;
				margin-bottom: 20px;
			}

			.invoice-table th {
				background: #000;
				color: #fff;
				padding: 12px;
				text-align: center;
				font-weight: bold;
				border: 1px solid #000;
			}

			.invoice-table td {
				padding: 12px;
				text-align: center;
				border: 1px solid #000;
				background: #fff;
				color: #000;
			}

			.invoice-summary {
				margin-top: 20px;
				width: 100%;
				max-width: 350px;
				margin-right: 0;
				padding: 15px;
				background: #fff;
				border: 1px solid #000;
				border-radius: 5px;
			}

			.summary-item {
				display: flex;
				justify-content: space-between;
				margin-bottom: 12px;
				font-size: 1rem;
				color: #000;
			}

			.total-item {
				font-weight: bold;
				font-size: 1.1rem;
				color: #000;
				padding-bottom: 12px;
				border-bottom: 2px solid #000;
				margin-bottom: 12px;
			}

			.invoice-footer {
				margin-top: 40px;
				text-align: center;
				font-size: 0.95rem;
				color: #000;
			}

			@media (max-width: 780px) {
				.buyer-grid {
					grid-template-columns: 1fr;
				}

				.invoice-info {
					flex-direction: column;
					gap: 1rem;
				}

				.invoice-print {
					padding: 1rem;
					margin: 0 auto 1rem;
				}
			}

			@media print {
				body {
					background: #fff;
				}

				.preview-header,
				.panel,
				.actions {
					display: none !important;
				}

				.invoice-print {
					box-shadow: none;
					padding: 0;
					border: none;
				}
			}
		`,
	],
})
export class InvoicePageComponent implements OnInit {
	cartItems: CartItem[] = [];
	customerName = "";
	customerPhone = "";
	paidAmount = 0;
	lastInvoiceDate = "";
	isLoading = false;
	errorMessage = "";
	successMessage = "";
	showPreview = false;
	today = new Date();

	constructor(private invoiceService: InvoiceService, private invoiceCartService: InvoiceCartService) {}

	ngOnInit(): void {
		this.cartItems = this.invoiceCartService.getItems();
		this.invoiceCartService.items$.subscribe((items) => {
			this.cartItems = items;
		});
	}

	total(): number {
		return this.invoiceService.calculateTotal(this.cartItems);
	}

	remainingAmount(): number {
		return Math.max(this.total() - this.paidAmount, 0);
	}

	changeAmount(): number {
		return this.paidAmount > this.total() ? this.paidAmount - this.total() : 0;
	}

	removeFromCart(productId: string): void {
		this.invoiceCartService.removeItem(productId);
	}

	maxQuantity(_productId: string): number {
		return 9999;
	}

	onCartQuantityChange(item: CartItem): void {
		const max = this.maxQuantity(item.productId);
		if (!Number.isFinite(item.quantity) || item.quantity < 1) {
			this.invoiceCartService.updateQuantity(item.productId, 1);
			return;
		}

		this.invoiceCartService.updateQuantity(item.productId, Math.min(Math.floor(item.quantity), max));
	}

	private invoicePayload(): InvoicePayload {
		return {
			customerName: this.customerName.trim(),
			customerPhone: this.customerPhone.trim() || "0",
			paidAmount: Number(this.paidAmount || 0),
			items: this.cartItems,
		};
	}

	completeInvoice(): void {
		if (!this.cartItems.length) {
			this.errorMessage = "اختر منتجًا واحدًا على الأقل لإصدار الفاتورة.";
			return;
		}

		if (!this.customerName.trim()) {
			this.errorMessage = "يرجى إدخال اسم المشتري.";
			return;
		}

		this.isLoading = true;
		this.errorMessage = "";
		this.successMessage = "";
		const payload = this.invoicePayload();

		this.invoiceService
			.createInvoice(payload)
			.pipe(
				switchMap((invoice: InvoiceResponse) => {
					this.lastInvoiceDate = invoice.date;
					return this.invoiceService
						.generatePdfByInvoiceId(invoice._id)
						.pipe(map((blob: Blob) => ({ blob, invoiceId: invoice._id })));
				})
			)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
			next: ({ blob, invoiceId }: { blob: Blob; invoiceId: string }) => {
				const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
				const url = URL.createObjectURL(pdfBlob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `invoice-${invoiceId}.pdf`;
				link.click();
				setTimeout(() => URL.revokeObjectURL(url), 60000);
				this.successMessage = "تم إنشاء الفاتورة وتحميل الملف بنجاح.";
				this.invoiceCartService.clear();
				this.customerName = "";
				this.customerPhone = "";
				this.paidAmount = 0;
			},
			error: (err: unknown) => {
				console.error("فشل إنشاء الفاتورة", err);
				this.errorMessage = err instanceof Error ? err.message : "فشل إنشاء الفاتورة.";
			},
		});
	}

	togglePreview(): void {
		this.showPreview = !this.showPreview;
	}

	formatNumberText(value: number | string): string {
		const raw = String(value ?? "");
		const normalized = raw.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
		return normalized;
	}

	formatMoneyEn(value: number): string {
		const amount = Number.isFinite(value) ? value : 0;
		return `${new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount)} جنيه`;
	}

	formatDateEn(value: Date): string {
		return new Intl.DateTimeFormat("en-GB", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(value);
	}
}
