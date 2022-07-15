<script lang="ts">
import { defineComponent, PropType } from "vue";
import { EventType, Notification } from "../../interfaces/api";
import { addHandler } from "./services/ws";

export default defineComponent({
  data: () => ({
    notificationTimeout: 8 * 1000,
    notifications: Array as PropType<Array<Notification>>,
  }),
  mounted() {
    this.notifications = [];
    addHandler(EventType.Redirect, this.onRedirect);
    addHandler(EventType.Notification, this.onNotification);
  },
  methods: {
    onRedirect(url: string): void {
      this.$router.push(url);
    },
    onNotification(notification: Notification): void {
      this.notifications.push(notification);
      setTimeout(() => {
        this.notifications.shift(); // Remove the first notification.
      }, this.notificationTimeout);
    },
  },
});
</script>

<template>
  <div>
    <router-view></router-view>
    <div id="notifications">
      <div
        v-for="(notification, key) in notifications"
        :key="key"
        class="toast"
      >
        <div class="alert alert-info" :class="notification.type">
          <div>
            <span>{{ notification.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
