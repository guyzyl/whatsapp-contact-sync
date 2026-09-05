<script lang="ts">
import { defineComponent } from "vue";
import { event } from "vue-gtag";

export default defineComponent({
  data: () => ({
    email: "",
    checkingPurchase: false,
    defaultError:
      "We couldn't verify your contribution. Check that you're using the email from your Buy Me a Coffee receipt, then try again.",
    waValidationError:
      "This contribution is linked to another WhatsApp account. Connect that account to continue.",
    errorMessage: null as string | null,
  }),

  mounted() {
    if (this.$route.query.show_error) {
      this.errorMessage = this.$route.query.show_error === "verification"
        ? "We couldn't check your access right now. Please try again in a moment."
        : this.waValidationError;
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
        <h1 class="text-5xl font-bold">Support WhatsApp Contact Sync</h1>
        <p class="py-6">
          A <strong>$1 contribution</strong> gives you
          <strong>one month of access for one WhatsApp account</strong>
          on <a href="/">whasync.com</a> and helps cover hosting costs.
          <br /><br />
          Prefer to host it yourself? The project is
          <a href="https://github.com/guyzyl/whatsapp-contact-sync"
            >open source</a
          > and free to run on your own computer.
        </p>
        <div class="mt-2">
          <p>1. Contribute $1 on Buy Me a Coffee</p>
          <p class="mt-2 text-sm">Already contributed? Enter your email below.</p>
          <div @click="coffeeClicked">
            <a href="https://www.buymeacoffee.com/guyzyl" target="_blank"
              ><img
                class="inline-flex"
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                style="height: 60px !important; width: 217px !important"
            /></a>
          </div>
        </div>

        <div class="inline-flex max-w-72 py-4">
          <div class="grid grid-cols-1">
            <div class="inline">2. Enter the email from your receipt</div>
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
                  placeholder="Email address"
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
            @keydown.enter="checkPurchase()"
            class="btn btn-primary"
            :class="{ 'btn-disabled': !email || checkingPurchase }"
            ><span
              v-if="checkingPurchase"
              class="loading loading-spinner"
            ></span
            >{{ checkingPurchase ? "Verifying…" : "Verify and continue" }}</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
