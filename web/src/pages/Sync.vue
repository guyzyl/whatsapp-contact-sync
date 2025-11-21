<script lang="ts">
import { defineComponent } from "vue";
import { event } from "vue-gtag";
import { EventType, SyncProgress } from "../../../interfaces/api";
import { addHandler, sendEvent } from "../services/ws";
import { enforcePayments } from "../settings";

interface ManualSyncData {
  existingPhoto: string | null;
  newPhoto: string;
  contactName: string | null;
}

export default defineComponent({
  data: () => ({
    imageDisplayedCount: 9,
    syncProgress: 0,
    syncCount: 0,
    images: [] as string[],
    totalContactsPushed: false,
    errorMessage: undefined as string | undefined,
    lastSyncReceived: null as number | null,
    showCoffeeButton: true,
    isManualSync: false as boolean | undefined,
    isManualSyncLoading: false as boolean | undefined,
    manualSyncData: null as ManualSyncData | null,
  }),

  mounted() {
    addHandler(EventType.SyncProgress, this.onSyncProgress);
    addHandler(EventType.SyncConfirm, this.onSyncConfirm);
    this.initSync();
    setInterval(this.checkServerDisconnected, 5 * 1000);
    enforcePayments.then((val) => {
      this.showCoffeeButton = val;
    });
  },

  methods: {
    initSync() {
      fetch(`/api/init_sync${window.location.search}`, {
        credentials: "include",
      });
    },

    checkServerDisconnected() {
      // Display an error message if the server has disconnected.
      this.errorMessage =
        this.lastSyncReceived &&
        this.syncProgress !== 100 &&
        Date.now() - this.lastSyncReceived > 30 * 1000
          ? "Server has disconnected. Please refresh the page and restart the process."
          : undefined;
    },

    onSyncProgress(progress: SyncProgress): void {
      if (!this.totalContactsPushed) {
        event("num_contacts_synced", {
          method: "Google",
          value: progress.totalContacts,
        });
        this.totalContactsPushed = true;
      }

      this.lastSyncReceived = Date.now();
      this.syncProgress = progress.progress;
      this.syncCount = progress.syncCount;
      this.errorMessage = progress.error;
      this.isManualSync = progress.isManualSync;
      if (progress.image) {
        this.images.push(progress.image);
        if (this.images.length > this.imageDisplayedCount) this.images.shift();
      }
    },

    onSyncConfirm(data: any): void {
      this.manualSyncData = data;
      this.isManualSyncLoading = false;
    },

    onPhotoConfirm(accept: boolean): void {
      this.isManualSyncLoading = true;
      this.manualSyncData = null;
      sendEvent(EventType.SyncPhotoConfirm, { accept });
    },
  },
});
</script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Sync In Progress</h1>

        <p class="py-6" v-if="!isManualSync">
          Your contacts are syncing, you can sit back and relax.
          <br /><br />
          (Syncing will stop if the tab is closed)
        </p>

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

        <div
          class="flex flex-col items-center my-8"
          v-if="isManualSync && !isManualSyncLoading"
        >
          <div class="text-2xl font-bold mb-4">
            {{ manualSyncData?.contactName ?? "Unknown person" }}'s Photo
          </div>
          <div class="flex flex-row gap-6">
            <div class="flex flex-col items-center">
              <span class="mb-2 font-semibold">Existing Photo</span>
              <div class="avatar avatar-placeholder mb-4">
                <div class="w-48 rounded-full ring-2 ring-white">
                  <img
                    v-if="manualSyncData?.existingPhoto"
                    :src="
                      'data:image/jpeg;base64, ' + manualSyncData?.existingPhoto
                    "
                    alt="Existing Google Photo"
                  />
                  <div v-if="!manualSyncData?.existingPhoto" class="text-xl">
                    No photo
                  </div>
                </div>
              </div>
              <button class="btn btn-success" @click="onPhotoConfirm(false)">
                Use Existing Photo
              </button>
            </div>
            <div class="flex flex-col items-center">
              <span class="mb-2 font-semibold">New Photo</span>
              <div class="avatar avatar-placeholder mb-4">
                <div class="w-48 rounded-full ring-2 ring-white">
                  <img
                    v-if="manualSyncData?.newPhoto"
                    :src="'data:image/jpeg;base64, ' + manualSyncData?.newPhoto"
                    alt="New Photo"
                  />
                  <div v-if="!manualSyncData?.newPhoto" class="text-xl">
                    No photo
                  </div>
                </div>
              </div>
              <button class="btn btn-info" @click="onPhotoConfirm(true)">
                Use New Photo
              </button>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col items-center mt-4 mb-4"
          v-if="isManualSync && isManualSyncLoading"
        >
          <span class="text-xl">Loading next contact...</span>
          <span class="loading loading-spinner loading-lg"></span>
        </div>

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
          <div
            class="avatar avatar-placeholder"
            v-if="syncCount >= imageDisplayedCount"
          >
            <div class="w-12 bg-neutral text-neutral-content">
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
