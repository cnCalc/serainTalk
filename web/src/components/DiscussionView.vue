<template lang="pug">
  div.discussion-view
    loading-icon(v-if="busy")
    ul.discussion-post-list.hide
      li(v-for="post in discussionPosts")
        div.discussion-post-container
          router-link(:to="'/m/' + post.user"): div.discussion-post-avater
            div.avatar-image(v-bind:style="{ backgroundImage: 'url(' + getMemberAvatarUrl(post.user) + ')'}")
            div.avatar-fallback {{ (members[post.user].username || '?').substr(0, 1).toUpperCase() }}
          div.discussion-post-body
            div.discussion-post-info 
              span.discussion-post-member {{ members[post.user].username }}
              span.discussion-post-date {{ new Date(1000 * post.createDate).toLocaleDateString() }}
            post-content.discussion-post-content(:content="post.content")
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';
import PostContent from './PostContent.vue';
import config from '../config';
// import { timeAgo } from '../utils/filters';

export default {
  name: 'discussion-view',
  components: {
    LoadingIcon, PostContent
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
    getMemberAvatarUrl (memberId) {
      let pad = number => ('000000000' + number.toString()).substr(-9);
      let member = this.members[memberId];
      if (member.uid) {
        // Discuz 用户数据
        let matchResult = pad(member.uid).match(/(\d{3})(\d{2})(\d{2})(\d{2})/);
        return `/uploads/avatar/${matchResult[1]}/${matchResult[2]}/${matchResult[3]}/${matchResult[4]}_avatar_big.jpg`;
      } else {
        // 新用户，直接返回字段
        return `/uploads/avatar/${member.avatar || 'default.png'}`;
      }
    },
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
      }, res => {
        // on error
        if (res.status === 404) {
          this.$router.push('/404');
        }
      });
    }
  },
  created () {
    this.loadDiscussionData();
  }
};
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
      }

      $avatar-size: 50px;
      div.discussion-post-avater {
        position: relative;
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
        overflow: hidden;

        div.avatar-image {
          position: absolute;
          width: 100%;
          height: 100%;
          background-size: cover;
        }
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
          line-height: 26px;
          font-size: 14px;
        }
      }
    }
  }
}

.light-theme div.discussion-view {
  blockquote {
    background-color: mix($theme_color, white, 10%);
  }
  div.discussion-post-container {
    border-bottom: mix($theme_color, white, 10%) solid 1px;
  }
  td {
    border: 1px solid mix($theme_color, white, 30%);
  }
  a {
    color: $theme_color;
  }
}

.dark-theme div.discussion-view {
  color: lightgray;
  blockquote {
    background-color: #111;
  }
  div.discussion-post-container {
    border-bottom:  solid 1px #444;
  }
  td {
    border: 1px solid #444;
  }
  a {
    color: white;
  }
}
</style>
