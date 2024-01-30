<script lang="ts">
import { defineComponent } from "vue";
import QrcodeVue from "qrcode.vue";
import { event } from "vue-gtag";
import isbot from "isbot";

import { EventType } from "../../../interfaces/api";
import { addHandler } from "../services/ws";

export default defineComponent({
  data: () => ({
    qrData: "",
    qrColorBlack: "#000000",
    qrColorGray: "oklch(0.961151 0 0)",
    waCon: false,
  }),
  mounted() {
    addHandler(EventType.WhatsAppQR, this.onQR);
    addHandler(EventType.WhatsAppConnecting, this.onConnecting);
    // Make sure we don't load the QR code for bots (this uses resources on the server)
    if (!isbot(navigator.userAgent)) this.initWhatsApp();
  },
  methods: {
    async initWhatsApp() {
      fetch("/api/init_whatsapp", { credentials: "include" });
    },
    onQR(data: string): void {
      if (!this.qrData) event("qr_loaded", { method: "Google" });
      this.qrData = data;
    },
    onConnecting(): void {
      // Just in case the event is triggered multiple times
      if (!this.waCon) event("whatsapp_connecting", { method: "Google" });
      this.waCon = true;
    },
  },
  components: {
    QrcodeVue,
  },
});
</script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Authorize WhatsApp</h1>
        <p class="py-6">
          Scan the QR code below to authorize access to your WhatsApp account.
          <a href="https://faq.whatsapp.com/539218963354346/?locale=en_US"
            >Click here</a
          >
          for help.
          <br />
          <b>Authorization will take a few seconds after QR code is scanned.</b>
        </p>
        <button
          class="btn btn-square btn-outline loading w-72 h-72"
          v-if="!qrData"
        ></button>
        <div class="relative z-0">
          <qrcode-vue
            class="inline-flex qr-code"
            v-if="qrData"
            :value="qrData"
            :size="288"
            :foreground="waCon ? qrColorGray : qrColorBlack"
          ></qrcode-vue>
          <div
            class="absolute inset-0 flex justify-center items-center z-10"
            v-if="waCon"
          >
            <div class="grid">
              <button class="btn btn-square btn-ghost loading w-auto"></button>
              <p>WhatsApp Authorizing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
