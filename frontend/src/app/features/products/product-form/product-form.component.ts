import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { finalize } from "rxjs";
import { ProductService } from "../../../core/services/product.service";
import { Product } from "../../../models/product.model";

@Component({
	selector: "app-product-form",
	template: `
		<section class="panel">
			<h2>{{ editMode ? 'تعديل منتج' : 'إضافة منتج' }}</h2>
			<p>{{ editMode ? 'قم بتحديث بيانات المنتج.' : 'أدخل بيانات منتج جديد.' }}</p>
			<p class="feedback loading" *ngIf="isLoading">جاري المعالجة...</p>
			<p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
			<p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

			<form [formGroup]="form" (ngSubmit)="submit()">
				<label>
					اسم المنتج
					<input type="text" formControlName="name" placeholder="مثال: شاي أخضر" />
				</label>

				<label>
					السعر
					<input type="number" formControlName="price" min="0" step="0.01" placeholder="0.00" />
				</label>

				<label>
					الكمية
					<input type="number" formControlName="quantity" min="0" placeholder="0" />
				</label>

				<button class="primary" type="submit" [disabled]="form.invalid || isLoading">
					{{ editMode ? 'حفظ التعديلات' : 'إضافة المنتج' }}
				</button>
			</form>
		</section>
	`,
	styles: [
		`
			.panel {
				padding: 1.15rem;
				max-width: 420px;
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
				font-size: 0.92rem;
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

			form {
				display: grid;
				gap: 0.9rem;
			}

			label {
				display: grid;
				gap: 0.35rem;
				font-weight: 600;
			}

			input {
				padding: 0.62rem 0.75rem;
				border-radius: 10px;
				border: 1px solid rgba(40, 28, 89, 0.24);
				outline: none;
			}

			button {
				width: fit-content;
				padding: 0.55rem 1rem;
				border-radius: 10px;
				border: none;
				font-weight: 700;
				cursor: pointer;
			}

			.primary {
				background: var(--color-mint);
				color: var(--color-navy);
			}

			button:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		`,
	],
})
export class ProductFormComponent implements OnInit {
	editMode = false;
	isLoading = false;
	errorMessage = "";
	successMessage = "";
	private productId: string | null = null;

	form = this.fb.nonNullable.group({
		name: ["", [Validators.required, Validators.minLength(2)]],
		price: [0, [Validators.required, Validators.min(0)]],
		quantity: [0, [Validators.required, Validators.min(0)]],
	});

	constructor(
		private fb: FormBuilder,
		private productService: ProductService,
		private route: ActivatedRoute,
		private router: Router
	) {}

	ngOnInit(): void {
		this.productId = this.route.snapshot.paramMap.get("id");
		this.editMode = !!this.productId;

		if (!this.productId) {
			return;
		}

		this.isLoading = true;
		this.productService
			.getById(this.productId)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
			next: (product: Product) =>
				this.form.patchValue({
					name: product.name,
					quantity: product.quantity || 0,
					price: product.price,
				}),
			error: (err: unknown) => {
				console.error("فشل تحميل المنتج للتعديل", err);
				this.errorMessage = err instanceof Error ? err.message : "فشل تحميل المنتج للتعديل.";
			},
		});
	}

	submit(): void {
		if (this.form.invalid) {
			return;
		}

		const payload = this.form.getRawValue();
		const request$ =
			this.editMode && this.productId
				? this.productService.update(this.productId, payload)
				: this.productService.create(payload);

		this.isLoading = true;
		this.errorMessage = "";
		this.successMessage = "";

		request$
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
			next: () => {
				this.successMessage = this.editMode ? "تم تحديث المنتج بنجاح." : "تم إضافة المنتج بنجاح.";
				setTimeout(() => this.router.navigate(["/products"]), 350);
			},
			error: (err: unknown) => {
				console.error("فشل حفظ المنتج", err);
				this.errorMessage = err instanceof Error ? err.message : "فشل حفظ المنتج.";
			},
		});
	}
}
