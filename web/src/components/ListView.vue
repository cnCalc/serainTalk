<template lang="pug">
  div.list-view
    div.jumbotron(v-if="typeof $route.params.categorySlug !== 'undefined'")
      h1 {{ categoryName }}
      h2 {{ categoryDescription }}
    div.nav
      div.left
        div.button.create-discussion 创建新帖
        category-list
      div.right
        discussion-list
</template>

<script>
import TagList from './TagList.vue';
import DiscussionList from './DiscussionList.vue';
import CategoryList from './CategoryList.vue';
import store from '../store';

export default {
  name: 'list-view',
  components: {
    TagList, DiscussionList, CategoryList
  },
  data () {
    return {
      categoryName: '',
      categoryDescription: ''
    }
  },
  created: function() {
  },
  methods: {
    setNameAndDescription(name, description) {
      this.categoryName = name;
      this.categoryDescription = description;
    }
  },
  computed: {
  }
}
</script>

<style lang="scss">
@import '../styles/global.scss';

div.jumbotron {
  min-height: 120px;
  background: #888;
  color: white;
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
div.nav {
  white-space: nowrap;
  vertical-align: top;
  padding-top: 15px;

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
