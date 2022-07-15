<script
  src="https://apis.google.com/js/platform.js?onload=renderButton"
  async
  defer
></script>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data: () => ({
    qrData: "",
  }),
  mounted() {},
  methods: {},
});
</script>

<template>
  <div id="home" class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Authorize Google</h1>
        <p class="py-6">
          Connect you Google account and authorize the requested permissions.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
