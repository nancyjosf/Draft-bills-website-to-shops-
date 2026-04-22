import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { InvoicePageComponent } from "./invoice-page/invoice-page.component";
import { InvoiceHistoryComponent } from "./invoice-history/invoice-history.component";

const routes: Routes = [
  { path: "", component: InvoicePageComponent },
  { path: "history", component: InvoiceHistoryComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceRoutingModule {}
