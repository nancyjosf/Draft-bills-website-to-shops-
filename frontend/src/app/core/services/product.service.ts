import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
import { Product } from "../../models/product.model";

@Injectable({ providedIn: "root" })
export class ProductService {
	private readonly baseUrl = "http://localhost:5000/products";

	constructor(private http: HttpClient) {}

	getAll(search = "", category?: string): Observable<Product[]> {
		const query: string[] = [];
		
		if (search.trim()) {
			query.push(`search=${encodeURIComponent(search.trim())}`);
		}
			
		if (category && category.trim()) {
			query.push(`category=${encodeURIComponent(category.trim())}`);
		}
		
		const url = query.length > 0 
			? `${this.baseUrl}?${query.join("&")}`
			: this.baseUrl;

		return this.http.get<Product[]>(url).pipe(catchError((error) => this.handleApiError(error)));
	}

	getById(id: string): Observable<Product> {
		return this.http
			.get<Product>(`${this.baseUrl}/${id}`)
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	create(payload: Omit<Product, "_id">): Observable<Product> {
		return this.http
			.post<Product>(this.baseUrl, payload)
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	update(id: string, payload: Omit<Product, "_id">): Observable<Product> {
		return this.http
			.put<Product>(`${this.baseUrl}/${id}`, payload)
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	remove(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/${id}`)
			.pipe(catchError((error) => this.handleApiError(error)));
	}

	private handleApiError(error: HttpErrorResponse): Observable<never> {
		const serverMessage = (error.error && error.error.message) || "";
		const fallbackMessage = "حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.";
		const message = serverMessage || fallbackMessage;
		return throwError(() => new Error(message));
	}
}
