import { NgModule } from "@angular/core";
import { SharedModule } from "../../shared/shared.module";
import { ProductListComponent } from "./product-list/product-list.component";
import { ProductFormComponent } from "./product-form/product-form.component";
import { ProductsRoutingModule } from "./products-routing.module";

@NgModule({
  declarations: [ProductListComponent, ProductFormComponent],
  imports: [SharedModule, ProductsRoutingModule],
})
export class ProductsModule {}
