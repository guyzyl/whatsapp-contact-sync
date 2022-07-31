<script lang="ts">
import { defineComponent } from "vue";
import { EventType, SyncProgress } from "../../../interfaces/api";
import { addHandler } from "../services/ws";

export default defineComponent({
  data: () => ({
    imageDisplayedCount: 9,
    syncProgress: 0,
    syncCount: 0,
    images: [] as string[],
  }),
  mounted() {
    addHandler(EventType.SyncProgress, this.onSyncProgress);
  },
  methods: {
    onSyncProgress(progress: SyncProgress): void {
      this.syncProgress = progress.progress;
      this.syncCount = progress.syncCount;
      if (progress.image) {
        this.images.push(progress.image);
      }
    },
  },
});
</script>

<template>
  <div id="home" class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Sync In Progress</h1>
        <p class="py-6">
          We're syncing your contacts. You can sit back and realx.
        </p>
        <div>
          <progress
            class="progress progress-primary w-5/6"
            :value="syncProgress"
            max="100"
            :hidden="syncProgress === 100"
          ></progress>
        </div>
        <div :hidden="syncProgress !== 100">
          <div class="badge badge-primary w-5/6">Sync complete!</div>
        </div>

        <div class="avatar-group -space-x-6 inline-flex pt-4">
          <div
            class="avatar"
            v-for="(image, index) in images.slice(-imageDisplayedCount)"
            :key="index"
          >
            <div class="w-12">
              <img :src="'data:image/jpeg;base64, ' + image" />
            </div>
          </div>
          <div class="avatar placeholder">
            <div class="w-12 bg-neutral-focus text-neutral-content">
              <span
                >+{{
                  syncCount > imageDisplayedCount
                    ? syncCount - imageDisplayedCount
                    : 0
                }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
