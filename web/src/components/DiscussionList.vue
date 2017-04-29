<template lang="pug">
  div: ul
    li(v-for="discussion in discussions") {{ discussion.title }}
</template>

<script>
import config from '../config';
import store from '../store'

export default {
  name: 'discussion-list',
  data () {
    return {
      discussions: []
    }
  },
  computed: {
    selectedTags: function() {
      return this.$store.state.selectedTags
    }
  },
  watch: {
    selectedTags: function(value, oldvaule) {
      let url = `${config.api.url}${config.api.version}/discussions/latest`;
      if (value.length > 0) {
        url += '?' + value.map(tag => `tag=${tag}`).join('&');
      }
      this.$http.get(url).then(res => {
        if (res.body.status === 'ok') {
          this.discussions = res.body.discussions;
        }
      })
    }
  }
}
</script>

<style lang="scss">
</style>
