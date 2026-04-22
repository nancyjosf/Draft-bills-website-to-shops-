import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
import { Product } from "../../models/product.model";

export interface CartItem {
	productId: string;
	name: string;
	price: number;
	quantity: number;
}

export interface InvoiceLineItem {
	name: string;
	price: number;
	quantity: number;
}

export interface InvoiceResponse {
	_id: string;
	customerName: string;
	customerPhone: string;
	date: string;
	items: InvoiceLineItem[];
	total: number;
	paid: number;
	remaining: number;
}

export interface InvoicePayload {
	customerName: string;
	customerPhone: string;
	paidAmount: number;
	items: CartItem[];
}

@Injectable({ providedIn: "root" })
export class InvoiceService {
	private readonly baseUrl = "http://localhost:5000/invoice";

	constructor(private http: HttpClient) {}

	calculateTotal(items: Array<{ price: number; quantity: number }>): number {
		return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
	}

	createInvoice(payload: InvoicePayload): Observable<InvoiceResponse> {
		return this.http
			.post<InvoiceResponse>(this.baseUrl, payload)
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	getInvoices(): Observable<InvoiceResponse[]> {
		return this.http
			.get<InvoiceResponse[]>(this.baseUrl)
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	generatePdfByInvoiceId(invoiceId: string): Observable<Blob> {
		return this.http
			.get(`${this.baseUrl}/${invoiceId}/pdf`, { responseType: "blob" })
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	generatePdf(payload: InvoicePayload): Observable<Blob> {
		return this.http
			.post(`${this.baseUrl}/pdf`, payload, { responseType: "blob" })
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	deleteInvoice(invoiceId: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/${invoiceId}`)
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	private handleApiError(error: HttpErrorResponse): Observable<never> {
		const serverMessage = (error.error && error.error.message) || "";
		const fallbackMessage = "تعذر تنفيذ طلب الفاتورة. حاول مرة أخرى.";
		const message = serverMessage || fallbackMessage;
		return throwError(() => new Error(message));
	}
}
