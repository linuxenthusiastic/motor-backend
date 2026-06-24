import { renderLogin } from "./pages/login";
import { renderCatalog } from "./pages/catalog";
import { getToken } from "./api/client";

const app = document.querySelector("#app") as HTMLElement;

function showLogin(): void {
  renderLogin(app, showCatalog);
}

function showCatalog(): void {
  renderCatalog(app, () => {
    localStorage.removeItem("token");
    showLogin();
  });
}

if (getToken()) {
  showCatalog();
} else {
  showLogin();
}
