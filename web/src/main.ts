import { createApp } from "vue";
import {
  createRouter,
  createWebHistory,
  RouteLocationNormalized,
} from "vue-router";
import VueGtag from "vue-gtag";
import "./style.css";
import App from "./App.vue";

import "./index.css";
import { initWs } from "./services/ws";
import { SessionStatus } from "../../interfaces/api";

const routes = [
  { path: "/", component: () => import("./pages/Home.vue") },
  { path: "/privacy", component: () => import("./pages/Privacy.vue") },
  { path: "/whatsapp", component: () => import("./pages/WhatsApp.vue") },
  { path: "/gauth", component: () => import("./pages/GoogleAuth.vue") },
  { path: "/options", component: () => import("./pages/Options.vue") },
  { path: "/sync", component: () => import("./pages/Sync.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(
  async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    // Makes sure websocket is initialized.
    //  This is done on every request to make sure the server didn't discconect in the meantime.
    initWs();

    // Don't make any checks for serving the index page.
    // This is done so the user can access it even if the backend is down.
    if (to.path == "/") return;

    const response = await fetch("/api/status", { credentials: "include" });
    const status: SessionStatus = await response.json();

    if (
      ["/sync", "/gauth", "/options"].includes(to.path) &&
      !status.whatsappConnected
    )
      router.push("/");
    else if (to.path === "/sync" && !status.googleConnected)
      router.push("/gauth");
    else if (to.path === "/whatsapp" && status.whatsappConnected)
      router.push("/gauth");
    else if (to.path === "/gauth" && status.googleConnected)
      router.push("/options");
  }
);

const vueTagSettings = {
  pageTrackerTemplate(to: RouteLocationNormalized) {
    return {
      page_title: to.path,
      page_path: to.path,
    };
  },
  config: { id: "G-4PJJZRPWG4" },
};

createApp(App).use(router).use(VueGtag, vueTagSettings, router).mount("#app");
