<template lang="pug">
  div#app
    nav-bar
    div.container
      keep-alive: router-view(keep-alive)
</template>

<script>
import NavBar from './NavBar.vue'

export default {
  name: 'app',
  components: {
    NavBar
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<style lang="scss">
@import '../styles/global.scss';

body {
  margin: 0;
  overflow-y: scroll;
  overflow-x: hidden;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 50px;
}


</style>
