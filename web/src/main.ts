import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "./style.css";
import App from "./App.vue";
import "./index.css";
import { initWs } from "./services/ws";

const routes = [
  { path: "/", component: () => import("./pages/Home.vue") },
  { path: "/whatsapp", component: () => import("./pages/WhatsApp.vue") },
  { path: "/gauth", component: () => import("./pages/GoogleAuth.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

initWs();
createApp(App).use(router).mount("#app");
