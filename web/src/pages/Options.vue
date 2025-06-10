<script lang="ts">
import { defineComponent } from "vue";

interface Option {
  title: string;
  description: string;
  target: string;
  value: boolean;
  onChange?: (options: Option[]) => (event: Event) => void;
}

const disableOtherOptionsOnChange = (target: string) => (options: Option[]) => (event: Event) => {
  const checkbox = event.target as HTMLInputElement;
  if (checkbox.checked) {
    options.filter((o) => o.target !== target).forEach((o) => (o.value = false));
  }
};

export default defineComponent({
  data: () => ({
    options: [
      {
        title: "Manual Sync",
        description: "If enabled, each photo can be compared and selected manually.",
        target: "manual_sync",
        value: false,
        onChange: disableOtherOptionsOnChange("manual_sync"),
      },
      {
        title: "Overwrite existing images",
        description: "If enabled, existing contact images will be overwritten.",
        target: "overwrite_photos",
        value: false,
        onChange: disableOtherOptionsOnChange("overwrite_photos"),
      },
    ],
  }),
  mounted() {},
  methods: {
    startSync() {
      const searchParams = new URLSearchParams();
      this.options.forEach((option) => {
        searchParams.set(option.target, String(option.value));
      });
      this.$router.push(`/sync?${searchParams.toString()}`);
    },
  },
});
</script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Sync Options</h1>

        <div class="form-control pt-6 flex flex-col">
          <label
            v-for="option in options"
            :key="option.target"
            class="label cursor-pointer mb-2 justify-between"
          >
            <div class="flex">
              <span class="pr-1">{{ option.title }}</span>
              <span class="tooltip" :data-tip="option.description">
                <!-- Src: https://heroicons.com/ -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  /></svg
              ></span>
            </div>
            <input
              type="checkbox"
              v-model="option.value"
              class="toggle toggle-primary"
              :onChange="option.onChange?.(options)"
            />
          </label>

          <div class="pt-6">
            <button class="btn btn-primary px-8" @click="startSync()">
              Start Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
