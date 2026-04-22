import { Component } from "@angular/core";

@Component({
	selector: "app-navbar",
	template: `
		<nav class="navbar">
			<h1>إدارة المتجر</h1>
			<div class="links">
				<a routerLink="/products" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">المنتجات</a>
				<a routerLink="/products/new" routerLinkActive="active">إضافة منتج</a>
				<a routerLink="/invoice" routerLinkActive="active">الفاتورة</a>
				<a routerLink="/invoice/history" routerLinkActive="active">سجل الفواتير</a>
			</div>
		</nav>
	`,
	styles: [
		`
			.navbar {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 1rem;
				padding: 1rem 1.2rem;
				background: linear-gradient(90deg, var(--color-navy), #3a2876);
			}

			h1 {
				margin: 0;
				font-size: 1.15rem;
				letter-spacing: 0.4px;
				color: var(--color-cream);
			}

			.links {
				display: flex;
				gap: 1rem;
				align-items: center;
			}

			a {
				padding: 0.4rem 0.75rem;
				border-radius: 999px;
				text-decoration: none;
				color: #f7f6ff;
				font-weight: 600;
				font-size: 0.95rem;
				transition: background-color 0.2s ease;
			}

			.active {
				color: var(--color-navy);
				background: var(--color-cream);
			}

			@media (max-width: 760px) {
				.navbar {
					flex-direction: column;
					align-items: flex-end;
				}

				.links {
					flex-wrap: wrap;
				}
			}
		`,
	],
})
export class NavbarComponent {}
