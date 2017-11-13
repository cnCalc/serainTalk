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
    },
    html () {
      // 让 KaTeX 自动渲染 DOM 中的公式
      this.$nextTick(() => {
        try {
          renderMathInElement(document.body);
        } catch (e) {
          console.log(e);
          // 渲染出错，大概率是用户打了一半没打完，直接忽略即可
        }
      });
    }
  },
  methods: {
  }
};
</script>

<style lang="scss">
@import '../styles/post-content.scss';
</style>

