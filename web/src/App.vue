<script lang="ts">
import { defineComponent } from "vue";
import { EventType } from "../../interfaces/api";
import { addHandler } from "./services/ws";

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
});
</script>

<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<style scoped></style>
