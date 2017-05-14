<template lang="pug">
  div.categories-list
    div.categories-block(v-for="(group, groupIndex) in categoriesGroup")
      h2.block-name {{ group.name }}
      router-link.category-name(
        :to="'/c/' + category.slug" 
        v-for="(category, categoryIndex) in group.categories" 
        :title="category.description"
      ) {{ category.name }}
</template>

<script>
import config from '../config';
import store from '../store';

export default {
  name: 'category-list',
  data () {
    return {
      categoriesGroup: []
    }
  },
  methods: {
    loadCategoryList() {
      let url = `${config.api.url}${config.api.version}/categories`;
      this.$http.get(url).then(res => {
        store.commit('setCategoriesGroup', res.body.groups)
        this.categoriesGroup = res.body.groups;
      })
    },
  },
  created() {
    this.loadCategoryList();
  }
}
</script>

<style lang="scss">
@import '../styles/global.scss';

div.categories-list {
  text-align: left;
  width: 90%;

  h2.block-name {
    padding-top: 15px;
    font-size: 12px;
    font-weight: normal;
    padding-left: 5px;
    color: grayscale($theme_color);
  }
  a.category-name {
    display: block;
    font-size: 13px;
    line-height: 1.8em;
    height: 1.8em;
    margin-top: 0.2em;
    padding-left: 5px;
    color: $theme_color;
    border-radius: 2px;
    // transition: color ease 0.1s;
  }
  a.category-name:hover {
    color: mix($theme_color, black, 40%);
  }
}

</style>
