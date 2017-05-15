<template lang="pug">
  div.not-found
    h1 Oops
    h2 The page you are looking for could not be found.
</template>

<script>
export default {
  name: 'not-found',  
}
</script>

<style lang="scss">
div.not-found {
  padding: 80px;
  h1, h2 {
    font-weight: normal;
  }
}
</style>
