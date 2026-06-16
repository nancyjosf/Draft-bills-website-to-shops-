import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ProductService } from "../../../core/services/product.service";
import { InvoiceCartService } from "../../../core/services/invoice-cart.service";
import { Product, PRODUCT_CATEGORIES, ProductCategory } from "../../../models/product.model";
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from "rxjs";

@Component({
	selector: "app-product-list",
	template: `
		<section class="panel">
			<header class="header-row">
				<h2>المنتجات</h2>
				<p>يمكنك إدارة قائمة المنتجات عبر التعديل والحذف.</p>
			</header>

			<div class="filter-section">
				<div class="category-filter">
					<button 
						class="chip" 
						[class.active]="!selectedCategory"
						(click)="selectCategory(null)">
						جميع المنتجات
					</button>
					<button 
						*ngFor="let category of categories"
						class="chip" 
						[class.active]="selectedCategory === category"
						(click)="selectCategory(category)">
						{{ category }}
					</button>
				</div>

				<input type="text" [(ngModel)]="search" placeholder="ابحث باسم المنتج" class="search" />
			</div>

			<p class="feedback loading" *ngIf="isLoading">جاري تحميل البيانات...</p>
			<p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
			<p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

			<table class="table">
				<thead>
					<tr>
						<th>اسم المنتج</th>
						<th>الفئة</th>
						<th>السعر</th>
						<th>الفاتورة</th>
						<th>الإجراءات</th>
					</tr>
				</thead>
				<tbody>
					<tr *ngFor="let product of products">
						<td>{{ product.name }}</td>
						<td><span class="category-badge" [class]="'category-' + (product.category || 'منظفات')">{{ product.category || 'منظفات' }}</span></td>
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
						<td colspan="5" class="empty">لا توجد منتجات مطابقة.</td>
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

			.filter-section {
				margin-bottom: 1.2rem;
			}

			.category-filter {
				display: flex;
				flex-wrap: wrap;
				gap: 0.6rem;
				margin-bottom: 1rem;
			}

			.chip {
				padding: 0.5rem 1rem;
				border-radius: 20px;
				border: 1.5px solid rgba(78, 141, 156, 0.4);
				background: #fff;
				color: var(--color-navy);
				cursor: pointer;
				font-weight: 600;
				font-size: 0.9rem;
				transition: all 0.3s ease;
			}

			.chip:hover {
				border-color: var(--color-teal);
				background: rgba(78, 141, 156, 0.1);
			}

			.chip.active {
				background: var(--color-teal);
				color: #fff;
				border-color: var(--color-teal);
			}

			.search {
				width: 100%;
				max-width: 400px;
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

			.category-badge {
				display: inline-block;
				padding: 0.4rem 0.8rem;
				border-radius: 12px;
				font-size: 0.85rem;
				font-weight: 600;
				text-align: center;
				min-width: 110px;
			}

			.category-منظفات {
				background: rgba(78, 141, 156, 0.2);
				color: var(--color-teal);
			}

			.category-ورقيات {
				background: rgba(156, 39, 176, 0.15);
				color: #9c27b0;
			}

			.category-مستحضرات {
				background: rgba(255, 152, 0, 0.15);
				color: #ff9800;
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

			@media (max-width: 768px) {
				.search {
					max-width: 100%;
				}

				.chip {
					font-size: 0.85rem;
					padding: 0.45rem 0.85rem;
				}
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
	selectedCategory: ProductCategory | null = null;
	categories = PRODUCT_CATEGORIES;
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

	selectCategory(category: ProductCategory | null): void {
		this.selectedCategory = category;
		this.loadProducts(this.search);
	}

	loadProducts(search = ""): void {
		this.isLoading = true;
		this.errorMessage = "";
		this.successMessage = "";

		this.productService
			.getAll(search, this.selectedCategory || undefined)
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
