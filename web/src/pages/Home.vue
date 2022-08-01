<script setup lang="ts"></script>

<template>
  <div id="home" class="hero h-full bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">WhatsApp Contact Sync</h1>
        <p class="py-6">
          This app will help you sync the contact images from WhatsApp and to
          Google Contacts (Apple support might be added in the future).
          <br /><br />
          In order to use this app, you will need to authorize access to your
          WhatsApp account, and to your Google (with People permissions only).
          <br /><br />
          We don't store any data on the server, and even delete all of the
          access keys after the sync has complete!
          <br />
          Don't believe me? You can checkout the code yourself over on
          <a
            href="
          https://github.com/guyzyl/whatsapp-contact-sync"
            >GitHub</a
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
