<template lang="pug">
  div.member-recent-posts
    discussion-list(:hideavatar="false" :list="member.watchedDiscussions") 
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
import config from '../config';

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
      return this.$store.state.member.watchedDiscussions;
    },
  },
  methods: {
    indexToPage,
    checkCanLoadMore () {
      if (this.discussions && this.discussions.length !== this.currentPage * config.api.pagesize) {
        this.canLoadMorePosts = false;
      }
    },
    loadMore () {
      this.currentPage++;
      this.$store.dispatch('fetchDiscussionsWatchedByMember', { id: this.$route.params.memberId, page: this.currentPage, append: true }).then(count => {
        this.checkCanLoadMore();
      });
    },
  },
  mounted () {
    if (this.member.watchedDiscussions === undefined) {
      this.$store.dispatch('fetchDiscussionsWatchedByMember', { id: this.$route.params.memberId }).then(() => {
        this.$forceUpdate();
        this.$nextTick(() => this.checkCanLoadMore());
      })
    } else {
      this.$nextTick(() => this.checkCanLoadMore());
    }
  }
};
</script>
