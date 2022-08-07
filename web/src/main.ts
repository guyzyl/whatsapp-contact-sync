import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "./style.css";
import App from "./App.vue";

import "./index.css";
import { initWs } from "./services/ws";
import { SessionStatus } from "../../interfaces/api";

const routes = [
  { path: "/", component: () => import("./pages/Home.vue") },
  { path: "/whatsapp", component: () => import("./pages/WhatsApp.vue") },
  { path: "/gauth", component: () => import("./pages/GoogleAuth.vue") },
  { path: "/sync", component: () => import("./pages/Sync.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from) => {
  const response = await fetch("/api/status", { credentials: "include" });
  const status: SessionStatus = await response.json();
  console.log(status);

  if (["/sync", "/gauth"].includes(to.path) && !status.whatsappConnected)
    router.push("/");
  else if (to.path === "/sync" && !status.googleConnected)
    router.push("/gauth");

  else if (to.path === "/whatsapp" && status.whatsappConnected)
    router.push("/gauth");
  else if (to.path === "/gauth" && status.googleConnected)
    router.push("/sync");
});

initWs();
createApp(App).use(router).mount("#app");
