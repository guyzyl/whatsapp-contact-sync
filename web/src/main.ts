import { createApp } from "vue";
import {
  createRouter,
  createWebHistory,
  RouteLocationNormalized,
} from "vue-router";
import { createGtag } from "vue-gtag";
import "./style.css";
import App from "./App.vue";

import "./index.css";
import { initWs } from "./services/ws";
import { SessionStatus } from "../../interfaces/api";
import { isbot } from "isbot";
import { setEnforcePayments } from "./settings";

const routes = [
  { path: "/", component: () => import("./pages/Home.vue") },
  { path: "/privacy", component: () => import("./pages/Privacy.vue") },
  { path: "/contribute", component: () => import("./pages/Contribute.vue") },
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
    // This is done on every request to make sure the server doesn't disconnect in the meantime.
    initWs();

    // Don't make any checks for serving the index page.
    // This is done so the user can access it even if the backend is down.
    // Additionally, bots are allowed to access any page they want.
    if (to.path == "/" || isbot(navigator.userAgent)) return;

    const response = await fetch("/api/status", { credentials: "include" });
    const status: SessionStatus = await response.json();

    setEnforcePayments(status.enforcePayments);

    if (
      ["/whatsapp", "/sync", "/gauth", "/options"].includes(to.path) &&
      status.enforcePayments &&
      !status.purchased
    )
      router.push("/contribute");
    else if (to.path === "/contribute" && status.purchased)
      router.push("/whatsapp");
    else if (
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
  },
);

let currentRoute: RouteLocationNormalized;

router.afterEach((to: RouteLocationNormalized) => {
  // This is run after each navigation, including the initial navigation.
  currentRoute = to;
});

const gtag = createGtag({
  tagId: "G-4PJJZRPWG4",
  pageTracker: { router },
});

createApp(App).use(router).use(gtag).mount("#app");
