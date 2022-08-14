<script lang="ts">
import { defineComponent } from "vue";

import GoogleAuth from "../components/GoogleAuth.vue";

export default defineComponent({
  data: () => ({}),
  mounted() {},
  methods: {},
  components: {
    GoogleAuth,
  },
});
</script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Authorize Google</h1>
        <p class="py-6">
          Connect your Google account.
          <br />
          Make sure to
          <b>select and authorize the requested contacts permission</b> to
          enable the upload of new contact photos.
        </p>
        <GoogleAuth></GoogleAuth>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
