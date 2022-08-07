<script lang="ts">
import { defineComponent } from "vue";
import QrcodeVue from "qrcode.vue";
import { EventType } from "../../../interfaces/api";
import { addHandler } from "../services/ws";

export default defineComponent({
  data: () => ({
    qrData: "",
  }),
  mounted() {
    addHandler(EventType.WhatsAppQR, this.onQR);
    this.initWhatsApp();
  },
  methods: {
    async initWhatsApp() {
      fetch("/api/init_whatsapp", { credentials: "include" });
    },
    onQR(data: string): void {
      this.qrData = data;
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
          <b
            >It may take a few seconds to authorize after the code is
            scanned.</b
          >
        </p>
        <button
          class="btn btn-square btn-outline loading w-72 h-72"
          v-if="!qrData"
        ></button>
        <qrcode-vue
          class="inline-flex"
          v-if="qrData"
          :value="qrData"
          :size="288"
        ></qrcode-vue>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
