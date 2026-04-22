import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ProductService } from "../../../core/services/product.service";
import { InvoiceCartService } from "../../../core/services/invoice-cart.service";
import { Product } from "../../../models/product.model";
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from "rxjs";

@Component({
	selector: "app-product-list",
	template: `
		<section class="panel">
			<header class="header-row">
				<h2>المنتجات</h2>
				<p>يمكنك إدارة قائمة المنتجات عبر التعديل والحذف.</p>
			</header>

			<input type="text" [(ngModel)]="search" placeholder="ابحث باسم المنتج" class="search" />

			<p class="feedback loading" *ngIf="isLoading">جاري تحميل البيانات...</p>
			<p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
			<p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

			<table class="table">
				<thead>
					<tr>
						<th>اسم المنتج</th>
						<th>السعر</th>
						<th>الفاتورة</th>
						<th>الإجراءات</th>
					</tr>
				</thead>
				<tbody>
					<tr *ngFor="let product of products">
						<td>{{ product.name }}</td>
						<td>{{ product.price | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</td>
						<td>
							<button class="add-invoice" (click)="addToInvoice(product)">أضف للفاتورة</button>
						</td>
						<td class="actions">
							<button class="secondary" (click)="edit(product)">تعديل</button>
							<button class="danger" (click)="remove(product)" [disabled]="isDeleting">حذف</button>
						</td>
					</tr>
					<tr *ngIf="!isLoading && products.length === 0">
						<td colspan="4" class="empty">لا توجد منتجات مطابقة.</td>
					</tr>
				</tbody>
			</table>

			<button class="go-invoice" (click)="goToInvoice()">الانتقال إلى صفحة الفاتورة</button>
		</section>
	`,
	styles: [
		`
			.panel {
				padding: 1.1rem;
				background: var(--surface);
				border-radius: 14px;
				border: 1px solid rgba(40, 28, 89, 0.14);
			}

			.header-row h2 {
				margin: 0;
				color: var(--color-navy);
			}

			.header-row p {
				margin: 0.35rem 0 1rem;
				color: var(--color-teal);
				font-size: 0.95rem;
			}

			.search {
				width: 100%;
				max-width: 400px;
				margin-bottom: 1rem;
				padding: 0.65rem 0.75rem;
				border-radius: 10px;
				border: 1px solid rgba(40, 28, 89, 0.24);
				outline: none;
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
				overflow: hidden;
				border-radius: 10px;
			}

			th,
			td {
				border-bottom: 1px solid rgba(78, 141, 156, 0.25);
				padding: 0.75rem;
				text-align: right;
			}

			th {
				background: rgba(133, 199, 154, 0.28);
			}

			.actions {
				display: flex;
				gap: 0.5rem;
				flex-wrap: wrap;
				justify-content: flex-end;
			}

			.empty {
				text-align: center;
				color: var(--color-teal);
			}

			button {
				padding: 0.45rem 0.8rem;
				border-radius: 8px;
				border: none;
				cursor: pointer;
				font-weight: 600;
			}

			.secondary {
				background: var(--color-teal);
				color: #fff;
			}

			.add-invoice {
				background: var(--color-mint);
				color: var(--color-navy);
			}

			.danger {
				color: #fff;
				background: var(--danger);
			}

			.go-invoice {
				margin-top: 1rem;
				background: var(--color-navy);
				color: #fff;
			}
		`,
	],
})
export class ProductListComponent implements OnInit, OnDestroy {
	products: Product[] = [];
	isLoading = false;
	isDeleting = false;
	errorMessage = "";
	successMessage = "";
	private _search = "";
	private searchChange$ = new Subject<string>();
	private destroy$ = new Subject<void>();

	get search(): string {
		return this._search;
	}

	set search(value: string) {
		this._search = value;
		this.searchChange$.next(value);
	}

	constructor(
		private productService: ProductService,
		private invoiceCartService: InvoiceCartService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.searchChange$
			.pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
			.subscribe({
			next: (value) => this.loadProducts(value),
		});

		this.loadProducts();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadProducts(search = ""): void {
		this.isLoading = true;
		this.errorMessage = "";
		this.successMessage = "";

		this.productService
			.getAll(search)
			.pipe(takeUntil(this.destroy$))
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
			next: (products: Product[]) => (this.products = products),
			error: (err: unknown) => {
				console.error("فشل تحميل المنتجات", err);
				this.errorMessage = err instanceof Error ? err.message : "فشل تحميل المنتجات.";
			},
		});
	}

	edit(product: Product): void {
		if (!product._id) {
			return;
		}

		this.router.navigate(["/products/edit", product._id]);
	}

	remove(product: Product): void {
		if (!product._id) {
			return;
		}

		this.isDeleting = true;
		this.errorMessage = "";
		this.productService
			.remove(product._id)
			.pipe(finalize(() => (this.isDeleting = false)))
			.pipe(takeUntil(this.destroy$))
			.subscribe({
			next: () => {
				this.successMessage = "تم حذف المنتج بنجاح.";
				this.loadProducts(this.search);
			},
			error: (err: unknown) => {
				console.error("فشل حذف المنتج", err);
				this.errorMessage = err instanceof Error ? err.message : "فشل حذف المنتج.";
			},
		});
	}

	addToInvoice(product: Product): void {
		this.invoiceCartService.addProduct(product);
		this.successMessage = `تمت إضافة ${product.name} إلى سلة الفاتورة.`;
	}

	goToInvoice(): void {
		this.router.navigate(["/invoice"]);
	}
}
