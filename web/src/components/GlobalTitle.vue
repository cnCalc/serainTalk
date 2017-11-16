<template lang="pug">
  div.jumbotron(v-if="globalTitle !== ''")
    h1 {{ decodeHTML(globalTitle) }}
    h2 {{ decodeHTML(globalSubtitle) }}
</template>

<script>
import decodeHTML from '../utils/decodeHTML';

export default {
  name: 'global-title',
  computed: {
    globalTitle () {
      return this.$store.state.globalTitle;
    },
    globalSubtitle () {
      return this.$store.state.globalSubtitle;
    }
  },
  methods: {
    decodeHTML
  }
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.jumbotron {
  min-height: 120px;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  overflow: hidden;
  transition: background linear 0.2s;
  text-shadow: 0 0 5px black;

  h1 {
    font-size: 24px;
    font-weight: 400;
    margin-top: 1.5rem;
  }
  h2 {
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 1.2rem;
  }
}

.light-theme {
  div.jumbotron {
    background: #888;
    color: white;
  }
}

.dark-theme {
  div.jumbotron {
    background-color: #333;
    color: lightgray;
  }
}
</style>
