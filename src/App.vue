<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
// import socket from './assets/socket.js';
export default {
  name: 'App',
  mounted() {
    // socket(window.location.hostname, 9095);
    // console.log('url:', this.$route.path);
    // console.log('all_url:', window.location.href);
    // console.log('host_url:', window.location.hostname);
  },
}
</script>

<style>
html, body {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}
#app {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  font-family: "Microsoft Yahei";
}
.img {
  width: 100%;
  height: 100%;
}
.img[lazy=loading] {
    width: 100%;
    height: 100%;
    background: url('./assets/images/loading.gif');
    background-size: contain;
}
.bar {
  width: 100%;
  height: 1.4vw;
  background-color: #f2f6f8;
}
</style>