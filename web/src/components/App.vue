<template lang="pug">
  div#app(v-bind:class="{ 'dark-theme': $store.state.theme === 'dark', 'light-theme': $store.state.theme === 'light' }")
    nav-bar
    global-title
    div.container
      keep-alive: router-view(v-if="$route.meta.keepAlive")
      router-view(v-if="!$route.meta.keepAlive")
</template>

<script>
import NavBar from './NavBar.vue';
import GlobalTitle from './GlobalTitle.vue';

export default {
  name: 'app',
  components: {
    NavBar, GlobalTitle
  }
};
</script>

<style lang="scss">
@import '../styles/global.scss';

body {
  margin: 0;
  overflow-y: scroll;
  overflow-x: hidden;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  padding-top: 50px;
  box-sizing: border-box;
  min-height: 100vh;
  transition: background-color linear 0.2s;
}

#app.dark-theme {
  background: #222;
}

</style>
