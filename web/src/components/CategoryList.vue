<template lang="pug">
  div.categories-list
    div.categories-block(v-for="(group, groupIndex) in categoriesGroup" :key="group.name")
      h2.block-name {{ group.name }}
      router-link.category-name(
        v-for="(category, categoryIndex) in group.categories" 
        :key="category.name"
        :to="'/c/' + category.slug" 
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
      categoriesGroup: [],
    };
  },
  methods: {
    loadCategoryList () {
      let url = `${config.api.url}${config.api.version}/categories`;
      this.$http.get(url).then(res => {
        store.commit('setCategoriesGroup', res.body.groups);
        this.categoriesGroup = res.body.groups;
      });
    },
  },
  created () {
    this.loadCategoryList();
  }
};
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
    border-radius: 2px;
  }
}

.light-theme div.categories-list {
  a.category-name {
    color: $theme_color;
  }
  a.category-name:hover {
    color: mix($theme_color, black, 40%);
  }
}

.dark-theme div.categories-list {
  a.category-name {
    color: lightgray;
  }
  a.category-name:hover {
    color: grey;
  }
}
</style>
