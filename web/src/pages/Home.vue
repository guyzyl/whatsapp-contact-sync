<script setup lang="ts"></script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">WhatsApp Contact Sync</h1>
        <p class="py-6">
          This app will sync your contact images from WhatsApp to Google
          Contacts (Apple support might be added in the future).
          <br /><br />
          In order to use this app, you will need to authorize access to your
          WhatsApp account and to your Google account.
          <br />
          You can checkout the code and open new issues on the
          <a
            href="
          https://github.com/guyzyl/whatsapp-contact-sync"
            >GitHub repository</a
          >.
        </p>
        <router-link to="/whatsapp" tag="button" class="btn btn-primary"
          >Get Started</router-link
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>
