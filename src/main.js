import Router from "./router/router.js";
import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import PublicationDetailView from "./views/ItemDetailView.js";

const routes = [
  { path: "/", view: HomeView },
  { path: "/acerca", view: AboutView },
  { path: "/item/:id", view: PublicationDetailView },
];

const app = document.getElementById("app");
const router = new Router(routes, app);

router.init();
