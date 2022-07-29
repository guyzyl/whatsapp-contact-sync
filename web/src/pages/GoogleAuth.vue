<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data: () => ({
    CLIENT_ID: "436316840541-2o1496o38gjv2udalq8tg32rao3ehdlv",
    API_KEY: "AIzaSyAy5TqbYpjFKzZq-ho-hS3aLkfVnAw9iBg",
    gisLoaded: false,
    gapiLoaded: false,
    tokenClient: null,
  }),
  mounted() {
    // TODO: Implement "logged in" verification
    window.onSignIn = this.onSignIn; // So the function is accessible from the Google sign-in button
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
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    },
    async onSignIn(resp) {
      if (resp.error !== undefined) {
        throw resp;
      }
      const token = gapi.client.getToken();
      fetch("/api/init_sync", {
        credentials: "include",
        method: "POST",
        body: JSON.stringify({ token: token }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  },
});
</script>

<template>
  <div id="home" class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Authorize Google</h1>
        <p class="py-6">
          Connect you Google account.
          <br />
          Make sure to
          <b>tick and authorize the requested contacts permission</b> to enable
          the upload of new conact photos.
        </p>
        <div>
          <!-- TODO: Improve button -->
          <button
            @click="handleAuthClick"
            :hidden="gapiLoaded && gisLoaded"
            id="signin-button"
            class="btn btn-primary"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
