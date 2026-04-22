import { NgModule } from "@angular/core";
import { SharedModule } from "../../shared/shared.module";
import { InvoicePageComponent } from "./invoice-page/invoice-page.component";
import { InvoiceHistoryComponent } from "./invoice-history/invoice-history.component";
import { InvoiceRoutingModule } from "./invoice-routing.module";

@NgModule({
  declarations: [InvoicePageComponent, InvoiceHistoryComponent],
  imports: [SharedModule, InvoiceRoutingModule],
})
export class InvoiceModule {}
