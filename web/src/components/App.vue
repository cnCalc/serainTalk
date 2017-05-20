<template lang="pug">
  div#app
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
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    };
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
  margin-top: 50px;
}


</style>
