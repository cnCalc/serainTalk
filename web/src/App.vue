<template lang="pug">
  div#app
    navbar
    div.container
      router-view
</template>

<script>
import Navbar from './Navbar.vue'

export default {
  name: 'app',
  components: {
    Navbar
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<style lang="scss">
@import './global.scss';

body {
  margin: 0;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
}

#app > .container {
  padding-top: 15px;
}

</style>
