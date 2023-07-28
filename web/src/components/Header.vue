<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data: () => ({}),
  mounted() {},
  methods: {},
});
</script>

<template>
  <div class="navbar bg-base-100">
    <div class="flex-1">
      <router-link to="/" tag="button" class="btn btn-ghost normal-case text-xl pl-0 md:pl-4"
        ><img class="h-8 w-8 mr-" src="/logo.png" />WhatsApp Contact
        Sync</router-link
      >
    </div>
    <div class="flex-none md:pr-4">
      <iframe
        src="https://ghbtns.com/github-btn.html?user=guyzyl&repo=whatsapp-contact-sync&type=star&count=true&size=large"
        frameborder="0"
        scrolling="0"
        width="125"
        height="30"
        title="GitHub"
      ></iframe>
    </div>
  </div>
</template>

<style scoped></style>
