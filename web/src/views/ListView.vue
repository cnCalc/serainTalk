<template lang="pug">
  div.list-view
    div.nav
      div.left
        div.button.create-discussion 创建新帖
        category-list
      div.right
        discussion-list
</template>

<script>
import DiscussionList from '../components/DiscussionList.vue';
import CategoryList from '../components/CategoryList.vue';

export default {
  name: 'list-view',
  components: {
    DiscussionList, CategoryList,
  }
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.nav {
  display: flex;
  vertical-align: top;
  padding: 15px;

  div.left {
    vertical-align: top;
    order: 1;
    flex-grow: 0;
    flex-shrink: 0;
    width: 220px;
  }

  div.right {
    vertical-align: top;
    display: inline-block;
    order: 2;
    flex-grow: 1;
    flex-shrink: 1;
    text-align: left;
    overflow: hidden;
  }

  div.create-discussion {
    width: 90%;
    margin-left: 0%;
    color: white;
  }
}

.light-theme div.nav {
  div.create-discussion {
    background-color: $theme_color;
    color: white;
  }

  div.button:hover {
    background-color: darken($theme_color, 7%);
  }
}

.dark-theme div.nav {
  div.create-discussion {
    background-color: #444;
    color: white;
  }

  div.button:hover {
    background-color: #666;
  }
}

</style>
