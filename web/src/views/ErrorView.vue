<template lang="pug">
  div.error-view
    h1 :(
    h2 The URL appears to be broken.
    h5 {{ $route.query.from }}
</template>

<script>
export default {
  name: 'error-view',
  created () {
    this.$store.commit('setGlobalTitles', []);
  }
};
</script>

<style lang="scss">
div.error-view {
  padding: 80px;
  text-align: left;
  h1, h2 {
    font-weight: normal;
    padding: 20px;
  }
  h1 {
    font-size: 48px;
  }
  h5 {
    padding-left: 20px;
  }
}

.dark-theme {
  h1, h2 {
    color: white;
  }
}
</style>
