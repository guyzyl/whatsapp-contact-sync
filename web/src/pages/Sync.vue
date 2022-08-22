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
    this.initSync();
  },
  methods: {
    initSync() {
      fetch("/api/init_sync", { credentials: "include" });
    },
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
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Sync In Progress</h1>
        <p class="py-6">
          We're syncing your contacts, you can sit back and relax.
          <br />
          Read about the syncing speed
          <a
            href="https://github.com/guyzyl/whatsapp-contact-sync/blob/24a9933c47579d9a49847ea5b5a8b8f00ea465ec/server/src/sync.ts#L17"
            target="”_blank”"
            >here</a
          >.<br /><br />
          (Syncing will stop if the tab is closed)
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

        <div class="pt-8">
          <a href="https://www.buymeacoffee.com/guyzyl" target="_blank"
            ><img
              class="inline-flex"
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              style="height: 60px !important; width: 217px !important"
          /></a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
