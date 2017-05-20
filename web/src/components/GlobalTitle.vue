<template lang="pug">
  div.jumbotron(v-if="globalTitle !== ''")
    h1 {{ globalTitle }}
    h2 {{ globalSubtitle }}
</template>

<script>
export default {
  name: 'global-title',
  computed: {
    globalTitle () {
      return this.$store.state.globalTitle;
    },
    globalSubtitle () {
      return this.$store.state.globalSubtitle;
    }
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
  h1, h2 {
    font-weight: normal;
    margin: 0;
  }
  h1 {
    padding-top: 1em;
    font-size: 24px;
    line-height: 2em;
  }
  h2 {
    font-size: 18px;
    line-height: 1.2em;
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
