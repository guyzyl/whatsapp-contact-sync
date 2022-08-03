<script lang="ts">
import { defineComponent } from "vue";
import { EventType } from "../../interfaces/api";
import { addHandler } from "./services/ws";
import Header from "./components/Header.vue";

export default defineComponent({
  data: () => ({}),
  mounted() {
    addHandler(EventType.Redirect, this.onRedirect);
  },
  methods: {
    onRedirect(url: string): void {
      this.$router.push(url);
    },
  },
  components: {
    Header,
  },
});
</script>

<template>
  <div class="flex flex-col h-screen">
    <Header></Header>
    <router-view></router-view>

    <!-- Hidden router links so pre-rendering will find all routes -->
    <router-link to="/whatsapp" tag="button" hidden>Get Started</router-link>
    <router-link to="/gauth" tag="button" hidden>Get Started</router-link>
    <router-link to="/sync" tag="button" hidden>Get Started</router-link>
  </div>
</template>

<style scoped></style>
