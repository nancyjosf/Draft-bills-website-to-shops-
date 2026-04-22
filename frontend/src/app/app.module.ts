import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { LOCALE_ID, DEFAULT_CURRENCY_CODE } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CoreModule } from "./core/core.module";
import { SharedModule } from "./shared/shared.module";

@NgModule({
	declarations: [AppComponent],
	imports: [BrowserModule, CoreModule, SharedModule, AppRoutingModule],
	providers: [
		{ provide: LOCALE_ID, useValue: "ar-EG" },
		{ provide: DEFAULT_CURRENCY_CODE, useValue: "EGP" },
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
