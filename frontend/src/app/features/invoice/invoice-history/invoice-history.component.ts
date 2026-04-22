import { Component, OnInit } from "@angular/core";
import { finalize } from "rxjs";
import { InvoiceResponse, InvoiceService } from "../../../core/services/invoice.service";

@Component({
  selector: "app-invoice-history",
  template: `
    <section class="panel">
      <h2>سجل الفواتير</h2>
      <p>جميع الفواتير التي تم إصدارها سابقًا.</p>

      <p class="feedback loading" *ngIf="isLoading">جاري تحميل سجل الفواتير...</p>
      <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <table class="table" *ngIf="!isLoading && invoices.length > 0">
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>اسم المشتري</th>
            <th>الإجمالي</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الوقت</th>
            <th>PDF</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let invoice of invoices">
            <td>{{ invoice._id.slice(-6) }}</td>
            <td>{{ invoice.customerName }}</td>
            <td>{{ invoice.total | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</td>
            <td>{{ invoice.paid | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</td>
            <td>{{ invoice.remaining | currency: 'EGP':'symbol':'1.2-2':'ar-EG' }}</td>
            <td>{{ invoice.date | date: 'short':'':'ar-EG' }}</td>
            <td><button class="export" (click)="downloadPdf(invoice)">تحميل</button></td>
            <td><button class="danger" (click)="deleteInvoice(invoice)">حذف</button></td>
          </tr>
        </tbody>
      </table>

      <p class="empty" *ngIf="!isLoading && invoices.length === 0">لا توجد فواتير حتى الآن.</p>
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

      h2 {
        margin: 0;
        color: var(--color-navy);
      }

      p {
        margin: 0.45rem 0 1rem;
        color: var(--color-teal);
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid rgba(78, 141, 156, 0.25);
        padding: 0.65rem;
        text-align: right;
      }

      th {
        background: rgba(133, 199, 154, 0.28);
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

      .error {
        background: rgba(179, 57, 81, 0.16);
        color: #8f1731;
      }

      .empty {
        color: var(--color-teal);
      }

      .export {
        padding: 0.42rem 0.75rem;
        border-radius: 8px;
        border: none;
        background: var(--color-teal);
        color: #fff;
        cursor: pointer;
        font-weight: 700;
      }

      .danger {
        padding: 0.42rem 0.75rem;
        border-radius: 8px;
        border: none;
        background: var(--danger);
        color: #fff;
        cursor: pointer;
        font-weight: 700;
      }
    `,
  ],
})
export class InvoiceHistoryComponent implements OnInit {
  invoices: InvoiceResponse[] = [];
  isLoading = false;
  errorMessage = "";

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.errorMessage = "";

    this.invoiceService
      .getInvoices()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (invoices: InvoiceResponse[]) => (this.invoices = invoices),
        error: (err: unknown) => {
          console.error("فشل تحميل سجل الفواتير", err);
          this.errorMessage = err instanceof Error ? err.message : "فشل تحميل سجل الفواتير.";
        },
      });
  }

  downloadPdf(invoice: InvoiceResponse): void {
    this.invoiceService.generatePdfByInvoiceId(invoice._id).subscribe({
      next: (blob: Blob) => {
        const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${invoice._id}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: (err: unknown) => {
        console.error("فشل تحميل ملف الفاتورة", err);
        this.errorMessage = err instanceof Error ? err.message : "فشل تحميل ملف الفاتورة.";
      },
    });
  }

  deleteInvoice(invoice: InvoiceResponse): void {
    const confirmed = window.confirm(`هل تريد حذف الفاتورة رقم ${invoice._id.slice(-6)}؟`);
    if (!confirmed) {
      return;
    }

    this.invoiceService.deleteInvoice(invoice._id).subscribe({
      next: () => {
        this.invoices = this.invoices.filter((item) => item._id !== invoice._id);
      },
      error: (err: unknown) => {
        console.error("فشل حذف الفاتورة", err);
        this.errorMessage = err instanceof Error ? err.message : "فشل حذف الفاتورة.";
      },
    });
  }
}
