<template lang="pug">
  div.not-found
    h1 :(
    h2 The page you are looking for could not be found.
</template>

<script>
export default {
  name: 'NotFound',
  activated () {
    this.$store.commit('setGlobalTitles', []);
  },
};
</script>

<style lang="scss">
div.not-found {
  padding: 80px;
  text-align: left;
  h1, h2 {
    font-weight: normal;
    padding: 20px;
  }
  h1 {
    font-size: 48px;
  }
}

.dark-theme {
  h1, h2 {
    color: white;
  }
}
</style>
