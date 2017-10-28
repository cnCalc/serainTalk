<template lang="pug">
  div.post-content(v-html="html")
</template>

<script>
export default {
  name: 'post-content',
  props: ['content', 'noattach'],
  data () {
    return {
      html: '',
      attachmentMap: {},
      loaded: false,
    };
  },
  created () {
    this.html = this.content;
  },
  watch: {
    content () {
      this.html = this.content;
    }
  },
  methods: {
  }
};
</script>

<style lang="scss">
@import '../styles/post-content.scss';
</style>

