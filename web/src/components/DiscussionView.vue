<template lang="pug">
  div.discussion-view
    loading-icon(v-if="busy")
    ul.discussion-post-list.hide
      li(v-for="post in discussionPosts")
        div.discussion-post-container
          div.discussion-post-avater {{ (members[post.user].username || '?').substr(0, 1).toUpperCase() }}
          div.discussion-post-body
            div.discussion-post-info 
              span.discussion-post-member {{ members[post.user].username }}
              span.discussion-post-date {{ new Date(1000 * post.createDate).toLocaleDateString() }}
            div.discussion-post-content(v-html="post.content")
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';
import config from '../config';
import { timeAgo } from '../utils/filters';

export default {
  name: 'discussion-view',
  components: {
    LoadingIcon
  },
  data () {
    return {
      busy: true,
      discussion: null,
      discussionMeta: {},
      discussionPosts: [],
      members: {},
    };
  },
  methods: {
    loadDiscussionData () {
      this.discussionId = this.$route.params.discussionId;
      let url = `${config.api.url}${config.api.version}/discussion/${this.discussionId}`;
      this.$http.get(url).then(res => {
        delete res.body.status;

        this.discussionPosts = res.body.posts;
        this.members = res.body.members;

        delete res.body.posts;
        delete res.body.members;

        this.discussionMeta = res.body;

        this.$store.commit('setGlobalTitles', [this.discussionMeta.title, this.discussionMeta.category]);
        this.busy = false;

        document.querySelector('ul.discussion-post-list.hide').classList.remove('hide');
      });
    }
  },
  created () {
    this.loadDiscussionData();
  }
}
</script>

<style lang="scss">
@import '../styles/global.scss';

div.discussion-view {
  padding: 15px;
  text-align: left;

  ul.discussion-post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    transition: all ease 0.5s;

    li {

      div.discussion-post-container {
        display: flex;
        margin-bottom: 25px;
        padding-bottom: 25px;
        border-bottom: mix($theme_color, white, 10%) solid 1px;
      }

      $avatar-size: 50px;
      div.discussion-post-avater {
        order: 1;
        flex-grow: 0;
        flex-shrink: 0;
        width: $avatar-size;
        height: $avatar-size;
        border-radius: $avatar-size / 2;
        background-color: mix($theme_color, white, 80%);
        text-align: center;
        color: white;
        line-height: $avatar-size;
        font-size: $avatar-size * 0.45;
      }

      div.discussion-post-body {
        order: 2;
        flex-grow: 1;
        flex-shrink: 1;
        margin-left: 15px;
        padding: 5px;

        span.discussion-post-member {
          font-size: 0.9em;
          font-weight: bold;
        }

        span.discussion-post-date {
          margin-left: 0.5em;
          font-size: 0.9em;
        }

        div.discussion-post-content {
          padding-top: 10px;
          line-height: 1.5em;
          font-size: 0.95em;

          blockquote {
            margin: 0;
            padding: 8px 15px 8px 15px;
            background-color: mix($theme_color, white, 10%);
            border-radius: 5px;
          }
        }
      }

    }
  }
}

</style>
