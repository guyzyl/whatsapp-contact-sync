<script lang="ts">
import { defineComponent } from "vue";
import { event } from "vue-gtag";

export default defineComponent({
  data: () => ({
    contributed: false,
  }),

  mounted() {
    event("contribution", { method: "Google" });
  },

  methods: {
    coffeeClicked() {
      this.contributed = true;
      event("contribution_coffee_clicked", { method: "Google" });
    },
  },
});
</script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Servers Are Expensive</h1>
        <p class="py-6">
          After paying hundreds of dollars for hosting whasync.com over the past
          year, I can no longer afford to pay for it myself.
          <br /><br />
          Please help out so I can keep the service running 😊
        </p>
        <div class="mt-2" @click="coffeeClicked">
          <a href="https://www.buymeacoffee.com/guyzyl" target="_blank"
            ><img
              class="inline-flex"
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              style="height: 60px !important; width: 217px !important"
          /></a>
        </div>
        <div class="inline-flex max-w-64 py-1">
          <label class="label cursor-pointer">
            <input
              type="checkbox"
              class="checkbox mr-2"
              v-model="contributed"
            />
            <span
              >I'm an awesome person and helped pay for the servers! 💜</span
            >
          </label>
        </div>
        <div class="mt-2">
          <router-link
            to="/options"
            class="btn btn-primary"
            :class="{ 'btn-disabled': !contributed }"
            >Continue</router-link
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
