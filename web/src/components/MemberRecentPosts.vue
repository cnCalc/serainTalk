<template lang="pug">
  div.member-recent-posts
    discussion-list(:hideavatar="true" :list="member.discussions") 
    loading-icon(v-if="busy")
    div.list-nav(v-if="canLoadMorePosts")
      button.button.load-more(@click="loadMore" v-if="!busy") 加载更多
    div.list-nav(v-else): span.already-max 没有更多了

</template>

<script>
import DiscussionList from './DiscussionList.vue';
import api from '../api';
import LoadingIcon from './LoadingIcon.vue';
import { timeAgo, indexToPage } from '../utils/filters';

export default {
  components: {
    LoadingIcon, DiscussionList,
  },
  data () {
    return {
      canLoadMorePosts: true,
      currentPage: 1,
    };
  },
  computed: {
    member () {
      return this.$store.state.member;
    },
    busy () {
      return this.$store.state.busy;
    },
    discussions () {
      return this.member.discussions;
    },
  },
  methods: {
    indexToPage,
    loadMore () {
      this.currentPage++;
      this.$store.dispatch('fetchDiscussionsCreatedByMember', { id: this.$route.params.memberId, page: this.currentPage, append: true }).then(count => {
        if (indexToPage(count) <= this.currentPage) {
          this.canLoadMorePosts = false;
        }
      });
    },
  },
};
</script>
