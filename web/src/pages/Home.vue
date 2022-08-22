<script lang="ts">
import { defineComponent } from "vue";
import { WS } from "../services/ws";

export default defineComponent({
  data: () => ({
    WS: WS,
    WebSocket: WebSocket,
  }),
  mounted() {},
  methods: {},
});
</script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">WhatsApp Contact Sync</h1>
        <p class="py-6">
          This app will sync your contact images from WhatsApp to Google
          Contacts (Apple support might be added in the future).
          <br /><br />
          In order to use this app, you will need to authorize access to your
          WhatsApp account and to your Google account.
          <br />
          You can checkout the code and open new issues on the
          <a
            href="
          https://github.com/guyzyl/whatsapp-contact-sync"
            >GitHub repository</a
          >.
        </p>
        <!-- Button is disabled until WS is connected to ensure the backed is serving before continuing. -->
        <router-link
          to="/whatsapp"
          class="btn btn-primary"
          :class="{ 'btn-disabled': WS.readyState !== WebSocket.OPEN }"
        >
          Get Started</router-link
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>
