<template lang="pug">
  div.nav
    div.left
      div.button.create-discussion 创建新帖
      tag-list
    div.right
      discussion-list
</template>

<script>
import TagList from './TagList.vue';
import DiscussionList from './DiscussionList.vue';

export default {
  name: 'list-view',
  components: {
    TagList, DiscussionList
  },
  data () {
    return {
    }
  },
  created: function() {
  },
  methods: {
  }
}
</script>

<style lang="scss">
@import '../styles/global.scss';

div.nav {
  white-space: nowrap;
  vertical-align: top;

  div.left {
    vertical-align: top;
    display: inline-block;
    width: 20%;
    height: 100px;
  }

  div.right {
    vertical-align: top;
    display: inline-block;
    width: 80%;
    text-align: left;
  }

  div.create-discussion {
    width: 90%;
    margin-left: 0%;
    background-color: $theme_color;
    color: white;
  }

  div.button:hover {
    background-color: darken($theme_color, 7%);
  }
}
</style>
