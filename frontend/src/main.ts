import "./styles/main.css";
import { renderLogin } from "./pages/login";
import { renderRegister } from "./pages/register";
import { renderCatalog } from "./pages/catalog";
import { getToken } from "./api/client";

const app = document.querySelector("#app") as HTMLElement;

function showLogin(): void {
  renderLogin(app, showCatalog, showRegister);
}

function showRegister(): void {
  renderRegister(app, showLogin, showLogin);
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
