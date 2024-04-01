<script lang="ts">
// @ts-nocheck
// This is indeed a bad solution, but the Google imports just don't play nice with Typesciprt...
import { defineComponent } from "vue";
import { event } from "vue-gtag";

export default defineComponent({
  data: () => ({
    CLIENT_ID: "436316840541-2o1496o38gjv2udalq8tg32rao3ehdlv",
    API_KEY: "AIzaSyAy5TqbYpjFKzZq-ho-hS3aLkfVnAw9iBg",
    gisLoaded: false,
    gapiLoaded: false,
    tokenClient: undefined as any, // Another Google typing workaround
  }),
  mounted() {
    this.addJSSrc("https://accounts.google.com/gsi/client", this.onGisLoaded);
    this.addJSSrc("https://apis.google.com/js/api.js", this.onGapiLoaded);
  },
  methods: {
    // Most code here is based on https://developers.google.com/people/quickstart/js
    addJSSrc(url: string, onLoad: () => void = () => {}) {
      const authScriptElement = document.createElement("script");
      authScriptElement.src = url;
      if (onLoad) {
        authScriptElement.onload = onLoad;
      }
      authScriptElement.setAttribute("async", "");
      authScriptElement.setAttribute("defer", "");
      document.head.appendChild(authScriptElement);
    },
    onGisLoaded() {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: "https://www.googleapis.com/auth/contacts",
        callback: this.onSignIn,
      });
      this.gisLoaded = true;
    },
    async onGapiLoaded() {
      gapi.load("client", this.initGapiClient);
      this.gapiLoaded = true;
    },
    async initGapiClient() {
      await gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/people/v1/rest",
        ],
      });
    },
    handleAuthClick() {
      // if (!this.tokenClient) return;
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    },
    async onSignIn(resp: any) {
      if (resp.error !== undefined) {
        throw resp;
      }
      event("google_authorized", { method: "Google" });
      const token = gapi.client.getToken();
      fetch("/api/init_gapi", {
        credentials: "include",
        method: "POST",
        body: JSON.stringify({ token: token }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (res.status === 200) {
          const url = new URL(res.url);
          this.$router.push(url.pathname);
        } else {
          throw res;
        }
      });
    },
  },
});
</script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Authorize Google</h1>
        <p class="py-6">
          Connect your Google account and authorize contact permissions.
          <br />
        </p>
        <div>
          <button
            @click="handleAuthClick"
            :disabled="!gapiLoaded && !gisLoaded"
            id="signin-button"
            class="btn btn-outline btn-primary gap-4"
          >
            <img class="w-8" alt="Google login" src="/google_logo.svg" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
