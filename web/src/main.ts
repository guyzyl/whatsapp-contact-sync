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
  {
    path: "/contacts_auth",
    component: () => import("./pages/ContactsAuth.vue"),
  },
  { path: "/sync", component: () => import("./pages/Sync.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from) => {
  const response = await fetch("/api/status", { credentials: "include" });
  const status: SessionStatus = await response.json();

  // Make sure websocket is initialized.
  //  This is done on every request to make sure the server didn't discconect in the meantime.
  initWs();

  if (
    ["/sync", "/contacts_auth"].includes(to.path) &&
    !status.whatsappConnected
  )
    router.push("/");
  else if (to.path === "/sync" && !status.googleConnected)
    router.push("/contacts_auth");
  else if (to.path === "/whatsapp" && status.whatsappConnected)
    router.push("/contacts_auth");
  else if (to.path === "/contacts_auth" && status.googleConnected)
    router.push("/sync");
});

createApp(App).use(router).mount("#app");
