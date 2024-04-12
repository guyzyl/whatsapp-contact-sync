<script lang="ts">
import { defineComponent } from "vue";
import { event } from "vue-gtag";

export default defineComponent({
  data: () => ({
    email: "",
    checkingPurchase: false,
    defaultError: "Failed to verify purchase.",
    waValidationError: "Purchase is valid for a single WhatsApp device only.",
    errorMessage: null as string | null,
  }),

  mounted() {
    if (this.$route.query.show_error) {
      this.errorMessage = this.waValidationError;
      event("contribution_error_shown", { method: "Google" });
    }
  },

  methods: {
    coffeeClicked() {
      this.errorMessage = null;
      event("contribution_wa_validation_failed", { method: "Google" });
    },

    checkPurchase() {
      if (!this.email) return;
      this.checkingPurchase = true;

      fetch("/api/check_purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.purchased) {
            this.$router.push("/whatsapp");
          } else {
            this.errorMessage = this.defaultError;
            this.checkingPurchase = false;
            event("contribution_validation_failed", { method: "Google" });
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
        <h1 class="text-5xl font-bold">Servers Are Expensive</h1>
        <p class="py-6">
          After paying hundreds of dollars for hosting whasync.com over the past
          year, I can no longer afford to pay for it myself.
          <br /><br />
          To use <a href="/">whasync.com</a>, you'll need to help pay for the
          servers and contribute money using the button bellow.
          <br />
          Each contribution gives you a month of access to the service for a
          single WhatsApp device!
          <br /><br />
          The project itself is open source, you can always run it locally if
          you prefer not to help out.
          <br /><br />
          Thanks for understanding 💜
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

        <div class="inline-flex max-w-64 py-4">
          <div class="grid grid-cols-1">
            <div class="inline">Email used for contribution:</div>
            <div>
              <label class="input input-bordered flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  class="w-4 h-4 opacity-70"
                >
                  <path
                    d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"
                  />
                  <path
                    d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"
                  />
                </svg>
                <input
                  v-model="email"
                  v-on:input="errorMessage = null"
                  type="text"
                  class="grow"
                  placeholder="Email"
                />
              </label>
            </div>
          </div>
        </div>

        <div
          role="alert"
          v-if="errorMessage"
          class="inline-flex mb-2 alert alert-error max-w-64"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <div class="mt-2">
          <a
            @click="checkPurchase()"
            class="btn btn-primary"
            :class="{ 'btn-disabled': !email || checkingPurchase }"
            ><span
              v-if="checkingPurchase"
              class="loading loading-spinner"
            ></span
            >Continue</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
