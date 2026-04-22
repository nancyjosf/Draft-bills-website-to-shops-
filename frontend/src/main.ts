import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { registerLocaleData } from "@angular/common";
import localeAr from "@angular/common/locales/ar";
import { AppModule } from "./app/app.module";

registerLocaleData(localeAr);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
