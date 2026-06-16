export interface Product {
  _id?: string;
  name: string;
  price: number;
  quantity?: number;
  category?: "منظفات" | "ورقيات" | "مستحضرات تجميل";
}

export const PRODUCT_CATEGORIES = ["منظفات", "ورقيات", "مستحضرات تجميل"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
