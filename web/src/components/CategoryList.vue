<template lang="pug">
  div.categories-list
    div.categories-block(v-for="(group, groupIndex) in categoriesGroup" :key="group.name")
      h2.block-name {{ group.name }}
      template(v-for="item in group.items" )
        router-link.category-name(
          v-if="item.type === 'category'"
          :key="item.name"
          :to="'/c/' + item.slug" 
          :title="item.description"
        ) {{ item.name }}
        a.category-name(
          v-else
          :href="item.href"
          :title="item.description"
          target="_blank"
        ) {{ item.name }}
</template>

<script>
export default {
  name: 'CategoryList',
  asyncData ({ store, route }) {
    return store.dispatch('fetchCategory');
  },
  computed: {
    categoriesGroup () {
      return this.$store.state.categoriesGroup;
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.categories-list {
  text-align: left;
  width: 90%;

  h2.block-name {
    font-size: 12px;
    font-weight: normal;
    padding-left: 5px;
    color: grayscale($theme_color);
    padding-top: 15px;
  }

  div.categories-block:first-child > .block-name {
    padding-top: 0px;
  }

a.category-name {
    display: block;
    font-size: 13px;
    line-height: 1.8em;
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
