<script setup lang="ts">
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";

const components = {
  Header,
  Footer,
};
</script>

<template>
  <v-app>
    <v-main>
      <Header />
      <router-view></router-view>
      <Footer />
    </v-main>
  </v-app>
</template>

<style scoped></style>
