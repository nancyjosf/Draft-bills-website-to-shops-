import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Product } from "../../models/product.model";
import { CartItem } from "./invoice.service";

const STORAGE_KEY = "invoice_cart_items";

@Injectable({ providedIn: "root" })
export class InvoiceCartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  readonly items$ = this.itemsSubject.asObservable();

  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  addProduct(product: Product): void {
    if (!product._id) {
      return;
    }

    const items = [...this.itemsSubject.value];
    const existing = items.find((item) => item.productId === product._id);

    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }

    this.setItems(items);
  }

  removeItem(productId: string): void {
    this.setItems(this.itemsSubject.value.filter((item) => item.productId !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    const items = [...this.itemsSubject.value];
    const item = items.find((x) => x.productId === productId);
    if (!item) {
      return;
    }

    item.quantity = Math.max(1, Math.floor(quantity || 1));
    this.setItems(items);
  }

  clear(): void {
    this.setItems([]);
  }

  private setItems(items: CartItem[]): void {
    this.itemsSubject.next(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed)
        ? parsed.filter((item) => item && item.productId && item.name && item.price >= 0 && item.quantity > 0)
        : [];
    } catch {
      return [];
    }
  }
}
