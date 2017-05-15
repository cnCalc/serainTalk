<template lang="pug">
  div: ul
    li(v-for="discussion in discussions") {{ discussion.title }}
</template>

<script>
import config from '../config';
import store from '../store';

export default {
  name: 'discussion-list',
  data () {
    return {
      discussions: []
    }
  },
  computed: {
    selectedCategory() {
      return this.$route.params.categorySlug
    },
    categoriesGroup() {
      return store.state.categoriesGroup;
    }
  },
  methods: {
    loadDiscussionList() {
      let slug = this.$route.params.categorySlug;
      if (typeof slug === 'undefined') {
        // TODO: Index view
      } else {
        let url = `${config.api.url}${config.api.version}/category/${slug}/discussions`;
        this.$http.get(url).then(res => {
          this.discussions = res.body.discussions;
        })
      }
    },
    updateListView() {
      let categoriesGroup = store.state.categoriesGroup;
      for (let group of categoriesGroup) {
        for (let category of group.categories) {
          if (category.slug === this.selectedCategory) {
            this.$parent.setNameAndDescription(category.name, category.description);
          }
        }
      }
    }
  },
  watch: {
    selectedCategory: function() {
      this.loadDiscussionList();
      this.updateListView();
    },
    categoriesGroup: function() {
      this.updateListView();
    }
  },
  created() {
    this.loadDiscussionList();
  }
}
</script>

<style lang="scss">
</style>
