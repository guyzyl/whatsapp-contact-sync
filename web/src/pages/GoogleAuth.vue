<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  methods: {
    handleAuthClick() {
      window.location.href = "/api/google_auth_start";
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
