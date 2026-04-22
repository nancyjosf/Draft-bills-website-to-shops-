import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <div class="app-shell">
      <app-navbar></app-navbar>
      <main class="page-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .app-shell {
        width: min(1040px, calc(100% - 2rem));
        margin: 1rem auto;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(40, 28, 89, 0.14);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 18px 45px rgba(40, 28, 89, 0.14);
      }

      .page-content {
        padding: 1.1rem;
      }
    `,
  ],
})
export class AppComponent {}
