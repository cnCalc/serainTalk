<template lang="pug">
  div.discussion-view
    div.discussion-view-left
      loading-icon(v-if="busy && (!settings.autoLoadOnScroll || maxPage === minPage)")
      ul.discussion-post-list(v-bind:class="{'hide': busy && (!settings.autoLoadOnScroll || maxPage === minPage)}"): li(v-for="(post, index) in showingPosts" :id="`index-${post.index}`" v-if="post" v-bind:class="{ deleted: post.status.type === 'deleted' }")
        div.discussion-post-container
          button.button.quote-button(v-bind:style="quoteButtonStyle") 引用
          article.discussion-post-body
            header.discussion-post-info
              router-link(:to="'/m/' + post.user").discussion-post-avater: div.discussion-post-avater
                div.avatar-image(v-if="members[post.user].avatar !== null" v-bind:style="{ backgroundImage: 'url(' + members[post.user].avatar + ')'}")
                div.avatar-fallback(v-else) {{ (members[post.user].username || '?').substr(0, 1).toUpperCase() }}
              span.discussion-post-member {{ members[post.user].username }} 
              span.discussion-post-index {{ `#${post.index}` + (post.status.type === 'deleted' ? '（仅管理员可见）' : '') }}
            post-content.discussion-post-content(:content="post.content", :reply-to="post.replyTo", :encoding="post.encoding" v-on:mouseup.native="showQuote(post, $event)")
            div.discussion-post-attachments(v-if="post.attachments.length > 0")
              div.attachment-wrapper
                h3 附件列表
                ul.attachment-list
                  li.attachment-item(v-for="id in post.attachments")
                    span(v-if="attachments[id].mime.indexOf('image/') !== 0")
                      a(:href="`#attach-${id}`") {{ attachments[id].fileName }}
                      | ({{ fileSize(attachments[id].size) }})
                    span(v-else)
                      a(:href="`/api/v1/attachment/${id}`", target="_blank") {{ attachments[id].fileName }}
                      | ({{ fileSize(attachments[id].size) }})
            div.fake-footer(v-bind:style="{ height: index === absoluteBottomIndex ? '70px': '0px' }")
            footer.discussion-post-info(v-bind:class="{ fixed: index === absoluteBottomIndex }", v-bind:style="{ width: index === absoluteBottomIndex ? absoluteBottomWidth + 'px' : ''}")
              div.discussion-post-date
                span 创建于 {{ new Date(post.createDate).toLocaleDateString() }}
                span(v-if="post.updateDate") ，编辑于 {{ new Date(post.updateDate).toLocaleDateString() }}
              div.button-left-container
                button.button.vote-up(@click="votePost(post.index, 'up')" :title="(post.votes.up.memberId || []).map(id => (members[id] || { username: 'undefined' }).username).join(', ')") {{ post.votes.up.count }}
                button.button.vote-down(@click="votePost(post.index, 'down')" :title="(post.votes.down.memberId || []).map(id => (members[id] || { username: 'undefined' }).username).join(', ')") {{ post.votes.down.count }}
                div.show-only-when-hover(style="float: right; display: flex; flex-direction: row-reverse; align-items: center")
                  button.button(v-if="discussionMeta.status.type === 'ok'" @click="activateEditor('REPLY_TO_INDEX', discussionMeta._id, post.user, post.index)") 回复
                  button.button(@click="copyLink(post.index)") 复制链接
                  button.button(@click="gotoBottom(post.index)" v-if="index === absoluteBottomIndex") 跳至末尾
                  template(v-if="$store.state.me")
                    button.button(v-if="(post.user === $store.state.me._id || $store.state.me.role === 'admin')" @click="activateEditor('EDIT_POST', discussionMeta._id, post.user, post.index)") 编辑
                    template(v-if="$store.state.me.role === 'admin'")
                      button.button(v-if="post.status.type === 'deleted'" @click="deletePost(post.index)") 恢复
                      button.button(v-else @click="deletePost(post.index)") 删除
      div.unread-message(v-if="!busy && unread.length !== 0" @click="loadUnread") {{ unread.length }} 条新回复，点击以查看。
      div(v-if="!busy && showingPosts.length === 0" style="height: 200px; line-height: 200px; font-size: 1.2em; color: grey")
        center 没有可展示的帖子
      pagination(v-bind:class="{'hide': busy}" :length="9" :active="currentPage" :max="pagesCount" :handler="loadPage" v-if="!settings.autoLoadOnScroll")
    div.discussion-view-right
      div.functions-slide-bar-container(v-bind:class="{'fixed-slide-bar': fixedSlideBar}", v-bind:style="{ opacity: busy ? 0 : 1 }")
        div.quick-funcs 快速操作
        button.button.quick-funcs(v-if="discussionMeta.status && discussionMeta.status.type === 'ok'") 订阅更新
        button.button.quick-funcs(v-if="discussionMeta.status && discussionMeta.status.type === 'ok'" @click="activateEditor('REPLY', discussionMeta._id)") 回复帖子
        button.button.quick-funcs(@click="scrollToTop(400)") 回到顶部
        template(v-if="$store.state.me && $store.state.me.role === 'admin'")
          button.button.quick-funcs(v-if="discussionMeta.status && discussionMeta.status.type === 'ok'", @click="lockDiscussion()") 锁定讨论
          button.button.quick-funcs(v-else, @click="lockDiscussion()") 解除锁定
          button.button.quick-funcs(@click="deleteDiscussion") 删除讨论
    div.hidden
      a.download-trigger
</template>

<script>
import LoadingIcon from '../components/LoadingIcon.vue';
import PostContent from '../components/PostContent.vue';
import Pagination from '../components/Pagination.vue';
import copyToClipboard from '../utils/clipboard';
import api from '../api';
import titleMixin from '../mixins/title';
import bus from '../utils/ws-eventbus';

import config from '../config';
import { indexToPage, fileSize } from '../utils/filters';
import { scrollToTop, scrollTo } from '../utils/scrollToTop';

function scrollToHash (hash) {
  let el = document.querySelector(hash);
  if (!el) {
    console.log('element not found: ' + hash);
    // throw new Error('fuck')
    return;
  }
  el.classList.add('highlight');
  setTimeout(() => {
    el.classList.remove('highlight');
  }, 2000);
  el.scrollIntoView();
  setTimeout(() => {
    if (el.getBoundingClientRect().top < 60) {
      window.scrollTo(0, window.scrollY - 60); // Height of NavBar
    }
  }, 0);
}

export default {
  name: 'discussion-view',
  components: {
    LoadingIcon, PostContent, Pagination,
  },
  mixins: [titleMixin],
  data () {
    return {
      pagesize: config.api.pagesize,
      minPage: null,  // 当前已加载的最小页数，仅在滚动自加载模式中有效
      maxPage: null,  // 当前已加载的最大页数，仅在滚动自加载模式中有效
      currentPage: null,
      fixedSlideBar: false,
      pagesCount: 0,  // 总页数
      pageLoaded: {}, // 已经加载了的页面
      currentDiscussion: null,
      absoluteBottomIndex: null,
      absoluteBottomWidth: 0,
      unread: [],
      quoteButtonStyle: {
        display: 'none',
        position: 'absolute',
      },
    };
  },
  title () {
    if (this.busy) {
      return 'Loading';
    } else if (this.unread.length !== 0) {
      return `(${this.unread.length}) ${this.discussionMeta.title}`;
    }
    return `${this.discussionMeta.title}`;
  },
  methods: {
    indexToPage, scrollToTop, copyToClipboard, fileSize,
    preventScroll () {
      return false;
    },
    loadNextPage () {
      if (this.maxPage < indexToPage(this.discussionMeta.postsCount) && !this.busy) {
        this.maxPage++;
        this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, page: this.maxPage });
      }
    },
    deletePost (index) {
      api.v1.discussion.deletePostByDiscussionIdAndIndex({ id: this.$route.params.discussionId, index })
        .then(() => {
          this.$store.dispatch('updateSingleDiscussionPost', { id: this.currentDiscussion, index, raw: false });
        })
        .catch(err => {
          window.alert('Error, see console for more detail.');
          console.error(err);
        });
    },
    votePost (index, type) {
      api.v1.discussion.votePostByDiscussionIdAndIndex({ id: this.currentDiscussion, index, vote: type })
        .then(res => {
          this.$store.dispatch('updateSingleDiscussionPost', { id: this.currentDiscussion, index, raw: false });
        })
        .catch(err => {
          if (err.response.status === 401) {
            bus.$emit('notification', {
              type: 'error',
              body: '游客无法执行此操作，请登录后继续。',
            });
          } else if (err.response.data.message === 'the discussion is locked.') {
            // TODO: use code instead of error message?
            bus.$emit('notification', {
              type: 'error',
              body: '当前讨论已被管理员锁定，无法进行该操作。',
            });
          } else {
            console.error(err);
            bus.$emit('notification', {
              type: 'error',
              body: '出现异常，查看控制台以获取详情。',
            });
          }
        });
    },
    loadPrevPage () {
      const state = this.$store;

      if (this.minPage > 1 && !this.busy) {
        this.minPage--;
        state.commit('setBusy', true);

        api.v1.discussion.fetchDiscussionPostsById({
          id: this.$route.params.discussionId,
          page: this.minPage,
        }).then(data => {
          state.commit('mergeMembers', data.members);
          state.commit('updateDiscussionPosts', data.posts);
          let diff = document.body.clientHeight - window.scrollY;
          this.$nextTick(() => {
            window.scrollTo(0, document.body.clientHeight - diff);
            state.commit('setBusy', false);
          });
        });
      }
    },
    loadPage (page) {
      scrollToTop(1000);
      this.$router.push(`/d/${this.$route.params.discussionId}/${page}`);
    },
    showQuote (post, event) {
      event.stopPropagation();

      const selection = window.getSelection();
      if (selection.rangeCount === 0) {
        return;
      }
      const range = selection.getRangeAt(0);
      const postContent = this.$el.querySelector(`#index-${post.index} div.discussion-post-content`);

      if (range.startOffset === range.endOffset || !postContent.contains(range.commonAncestorContainer) || !(range.commonAncestorContainer instanceof window.Text)) {
        // 选择的范围超过了一个帖子，或者根本没有选中长度，当然就不能去引用这些玩意儿咯
        this.hideQuote();
        return;
      }

      const rects = window.getSelection().getRangeAt(0).getClientRects();
      const lastRect = rects[rects.length - 1];
      this.quoteButtonStyle = {
        display: '',
        position: 'absolute',
        top: lastRect.bottom + window.scrollY + 'px',
        left: lastRect.right + 'px',
        transform: 'translateX(-100%)',
      };
    },
    hideQuote () {
      this.quoteButtonStyle = {
        display: 'none',
        position: 'absolute',
      };
    },
    scrollWatcher () {
      if (this.settings.autoLoadOnScroll) {
        if (window.scrollY + window.innerHeight + config.discussionView.boundingThreshold.bottom > document.body.clientHeight) {
          this.loadNextPage();
        }
        if (window.scrollY < config.discussionView.boundingThreshold.top) {
          this.loadPrevPage();
        }
      }

      // 变更右侧边栏的固定模式
      this.fixedSlideBar = window.scrollY > 120 + 15;

      // 找出需要浮动底部的对应post
      // FIXME: 此处可能会有性能问题？
      if (!this.settings.nofixedtoolbar) {
        let els = Array.from(this.$el.querySelectorAll('article'));
        this.absoluteBottomIndex = undefined;

        for (let i = 0; i < els.length; ++i) {
          let rect = els[i].getBoundingClientRect();
          if (rect.bottom + 5 > window.innerHeight && rect.top < window.innerHeight - 200) {
            const fakeFooter = this.$el.querySelector('.fake-footer');
            if (fakeFooter) {
              this.absoluteBottomIndex = i;
              this.absoluteBottomWidth = fakeFooter.clientWidth;
            }
            break;
          }
        }
      }
    },
    lockDiscussion () {
      api.v1.discussion.lockDiscussionById({ id: this.discussionMeta._id }).then(() => {
        this.$store.dispatch('fetchDiscussionsMeta', { id: this.$store.state.discussionMeta._id });
      }).catch((error) => {
        console.error(error);
      })
    },
    deleteDiscussion () {
      this.$store.dispatch('showMessageBox', {
        title: '危险操作警告',
        type: 'OKCANCEL',
        message: `<p>您确定要<span style="color: #a00; font-weight: 700;">删除</span>该讨论吗？该操作不可恢复！</p><p>如果需要让该讨论对普通用户不可见，只需要编辑一楼，将它的分区改为「内部版块」即可。</p><p>完成删除后将返回至上一个页面，可能需要刷新浏览器才能看到变更。</p>`,
        html: true,
      }).then(() => {
        api.v1.discussion.deleteDiscussionPermanentlyById({ id: this.discussionMeta._id }).then(() => {
          window.history.go(-1);
        }).catch((error) => {
          console.error(error);
        })
      }).catch(() => {
      });
    },
    activateEditor (mode, discussionId, memberId, index) {
      this.$store.commit('updateEditorMode', { mode, discussionId, discussionTitle: this.discussionMeta.title, discussionCategory: this.discussionMeta.category, memberId, index });
      this.$store.commit('updateEditorDisplay', 'show');
    },
    copyLink (idx) {
      copyToClipboard(`${window.location.origin}/d/${this.discussionMeta._id}/${indexToPage(idx)}#index-${idx}`);
    },
    gotoBottom (idx) {
      let targetScrollTop = this.$el.querySelector(`#index-${idx}`).getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      scrollTo(targetScrollTop, 300);
    },
    loadUnread () {
      let foundCurrentPage = false;
      while (this.unread[0] && this.indexToPage(this.unread[0]) === this.currentPage) {
        this.unread.shift();
        foundCurrentPage = true;
      }
      if (foundCurrentPage) {
        this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, page: this.$route.params.page, quiet: true });
        this.updateTitle();
      } else if (this.unread.length > 0) {
        this.$store.dispatch('fetchDiscussionsMeta', { id: this.$route.params.discussionId }).then(() => {
          const page = this.indexToPage(this.unread[0]);
          this.loadPage(page);
          this.$nextTick(() => {
            while (this.unread[0] && this.indexToPage(this.unread[0]) === page) {
              this.unread.shift();
            }
            this.updateTitle();
          });
        });
      }
    },
    downloadAttachment (attachId) {
      api.v1.attachment.getRemainingTraffic().then(traffic => {
        if (traffic.remainingTraffic < 0) {
          window.history.go(-1);
          return bus.$emit('notification', {
            type: 'error',
            body: '您今日的下载流量已经用尽，请明日再试。',
          });
        }

        if (this.attachments[attachId] === undefined) {
          window.history.go(-1);
          return bus.$emit('notification', {
            type: 'error',
            body: '该附件链接无效！',
          });
        }
        
        this.$store.dispatch('showMessageBox', {
          title: '附件下载确认',
          type: 'OKCANCEL',
          message: `<p>你确定要下载 ${this.attachments[attachId].fileName} 吗？</p><p>该操作将会使用 ${this.fileSize(this.attachments[attachId].size)} 流量，您当前剩余流量为 ${this.fileSize(traffic.dailyTraffic - traffic.usedTraffic)}。</p>`,
          html: true,
        }).then(() => {
          const downloadTrigger = this.$el.querySelector('a.download-trigger');
          downloadTrigger.href = `/api/v1/attachment/${attachId}`;
          downloadTrigger.download = this.attachments[attachId].fileName;
          downloadTrigger.target = '_blank';
          downloadTrigger.click();
          window.history.go(-1);
        }).catch(() => {
          window.history.go(-1);
        });
      });
    },
    updateGlobalTitle () {
      let { title, category } = this.discussionMeta;

      if (this.discussionMeta.status && this.discussionMeta.status.type === 'locked') {
        title += '（已锁定）'
      }

      this.$store.commit('setGlobalTitles', [title, category]);
    }
  },
  computed: {
    discussionMeta () {
      return this.$store.state.discussionMeta;
    },
    discussionPosts () {
      if (!this.settings.autoLoadOnScroll) {
        return this.$store.state.discussionPosts.slice((this.currentPage - 1) * this.pagesize + 1, this.currentPage * this.pagesize + 1);
      } else {
        return this.$store.state.discussionPosts;
      }
    },
    showingPosts () {
      return this.discussionPosts;
    },
    members () {
      return this.$store.state.members;
    },
    attachments () {
      return this.$store.state.attachments;
    },
    settings () {
      return this.$store.state.settings;
    },
    busy () {
      return this.$store.state.busy;
    },
  },
  watch: {
    discussionMeta (val) {
      this.updateGlobalTitle();
      this.pagesCount = indexToPage(this.discussionMeta.postsCount);
    },
    '$route': function (route) {
      if (!route.params.discussionId) {
        return;
      }

      if (this.currentDiscussion !== route.params.discussionId) {
        const page = Number(this.$route.params.page) || 1;

        this.$store.commit('setGlobalTitles', [' ']);
        this.currentDiscussion = route.params.discussionId;
        this.maxPage = page;
        this.minPage = page;
        this.currentPage = page;
        this.pageLoaded = [];
        this.pageLoaded[this.currentPage] = true;

        return this.$options.asyncData.call(this, { store: this.$store, route: this.$route }).then(() => {
          this.$forceUpdate();
          this.scrollWatcher();
          if (this.settings.autoLoadOnScroll && page !== 1) {
            this.minPage = page - 1;
            this.pageLoaded[this.currentPage - 1] = true;
          }
        });
      }

      this.scrollWatcher();
      this.updateGlobalTitle();

      if (this.pageLoaded[Number(route.params.page) || 1]) {
        this.currentPage = Number(route.params.page) || 1;
        this.$nextTick(() => this.$route.hash && scrollToHash(this.$route.hash));
        this.updateTitle();
        return;
      }

      this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, page: route.params.page }).then(() => {
        this.currentPage = Number(route.params.page) || 1;
        this.pageLoaded[this.currentPage] = true;
        this.$nextTick(() => this.$route.hash && scrollToHash(this.$route.hash));
        this.updateTitle();
      });
    },
    '$route.hash': function (hash) {
      const attachPattern = /\#attach\-([0-9a-fA-F]{24})/;
      if (hash) {
        if (attachPattern.test(hash)) {
          const attachId = hash.match(attachPattern)[1];
          this.downloadAttachment(attachId);
        } else {
          scrollToHash(hash);
        }
      }
    },
  },
  created () {
    this.currentDiscussion = this.$route.params.discussionId;

    bus.$on('reloadDiscussionView', () => {
      const page = Number(this.$route.params.page) || 1;

      this.$options.asyncData.call(this, { store: this.$store, route: this.$route }).then(() => {
        this.$forceUpdate();
        this.scrollWatcher();
        if (this.settings.autoLoadOnScroll && page !== 1) {
          this.minPage = page - 1;
          this.pageLoaded[this.currentPage - 1] = true;
        }
        this.unread = [];
        this.updateTitle();
      });
    });

    bus.$on('event', e => {
      if (e.entity !== 'Post') {
        return;
      }

      if (e.affects.discussionId === this.currentDiscussion) {
        if (e.eventType === 'Create') {
          this.unread.push(e.affects.postIndex);
          this.updateTitle();
          return;
        } else if (e.eventType === 'Update' && (this.settings.autoLoadOnScroll || this.indexToPage(e.affects.postIndex) === this.currentPage) && e.affects.postIndex <= this.discussionMeta.postsCount) {
          this.$store.dispatch('updateSingleDiscussionPost', { id: this.currentDiscussion, index: e.affects.postIndex, raw: false });
        }
      }
    });
  },
  mounted () {
    window.addEventListener('scroll', this.scrollWatcher, { passive: true });
    window.addEventListener('mouseup', this.hideQuote, { passive: true });

    const page = Number(this.$route.params.page) || 1;
    this.maxPage = page;
    this.minPage = page;
    this.currentPage = page;
    this.pageLoaded[this.currentPage] = true;

    if (this.settings.autoLoadOnScroll && page !== 1) {
      this.minPage = page - 1;
      this.pageLoaded[this.currentPage - 1] = true;
    }
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.scrollWatcher);
    window.removeEventListener('mouseup', this.hideQuote, { passive: true });
  },
  activated () {
    this.updateTitle();
    window.addEventListener('scroll', this.scrollWatcher, { passive: true });
    window.addEventListener('mouseup', this.hideQuote, { passive: true });
  },
  deactivated () {
    window.removeEventListener('scroll', this.scrollWatcher);
    window.removeEventListener('mouseup', this.hideQuote, { passive: true });
  },
  asyncData ({ store, route }) {
    const page = Number(route.params.page) || 1;
    return store.dispatch('fetchDiscussion', { id: route.params.discussionId, page, preloadPrevPage: store.state.autoLoadOnScroll }).then(() => {
      if (window.location.hash) {
        scrollToHash(window.location.hash);
      }
      this.updateTitle();
    }).catch(error => {
      if (error.response.status === 404) {
        this.$router.replace('/not-found');
      }
    });
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.discussion-view {
  padding: 16px 8px;
  text-align: left;
  display: flex;

  .hide {
    transition: all ease 0s;
  }

  div.discussion-view-left {
    flex: 1 1;
    min-width: 0;
    padding-right: 5px;
  }

  $right_width: 100px;
  div.discussion-view-right {
    order: 2;
    flex: 0 0 $right_width;
    position: relative;
    @include respond-to(phone){
      display: none;
    }

    div.functions-slide-bar-container {
      width: $right_width;
      font-size: 0.8em;

      button.quick-funcs {
        width: 100%;
      }

      div.quick-funcs {
        margin: 1em 0 1em 0;
        width: 100%;
        padding: 0;
        text-align: center;
      }
    }

    div.fixed-slide-bar {
      position: fixed;
      top: 50px;
    }
  }

  ul.discussion-post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    transition: all ease 0.5s;

    li {
      transition: background ease 0.5s;
      &.deleted {
        background-color: #ffe8e8e8;
      }
      div.discussion-post-container {
        display: flex;
        padding: 16px 8px;

      }

      @mixin set-avatar-size($avatar-size) {
        a.discussion-post-avater {
          width: $avatar-size;
          height: $avatar-size;
        }
        div.discussion-post-avater {
          width: $avatar-size;
          height: $avatar-size;
          border-radius: $avatar-size / 2;
          line-height: $avatar-size;
          font-size: $avatar-size * 0.45;
        }
      }

      @mixin set-avatar-outside($avatar-size) {
        a.discussion-post-avater {
          display: block;
          width: 0;
          height: 0;
          overflow: show;
        }
        div.discussion-post-avater {
          margin-left: -$avatar-size - 12px - 4px;
          margin-top: -10px;
          z-index: 1;
        }
        .discussion-post-body > * {
          border-left: $avatar-size + 12px + 8px solid rgba(0, 0, 0, 0);
        }
      }

      @include respond-to(phone) {
        @include set-avatar-size(32px);
        span.discussion-post-member {
          padding: 0 0.3em;
        }
      }

      @include respond-to(tablet) {
        @include set-avatar-size(50px);
        @include set-avatar-outside(50px);
      }

      @include respond-to(laptop) {
        @include set-avatar-size(60px);
        @include set-avatar-outside(60px);
      }

      // div.show-only-when-hover {
      //   transition: all ease 0.2s;
      //   opacity: 0;
      // }

      // &:hover div.show-only-when-hover {
      //   opacity: 1;
      // }

      header.discussion-post-info {
        display: flex;
        align-items: center;
      }

      span.discussion-post-member {
        flex-grow: 1;
        flex-shrink: 1;
        font-size: 0.9em;
        font-weight: bold;
      }

      span.discussion-post-index {
        margin-right: 0.5em;
        font-size: 0.9em;
      }

      div.discussion-post-avater {
        position: relative;
        order: 1;
        flex-grow: 0;
        flex-shrink: 0;
        background-color: mix($theme_color, white, 80%);
        text-align: center;
        color: white;
        overflow: hidden;

        div.avatar-image {
          position: absolute;
          width: 100%;
          height: 100%;
          background-size: cover;
        }
      }

      article.discussion-post-body {
        order: 2;
        flex-grow: 1;
        flex-shrink: 1;
        max-width: 100%;
        // position: relative;
        // padding: 5px;

        span.discussion-post-date {
          margin-left: 0.5em;
          font-size: 0.9em;
        }

        div.discussion-post-content {
          padding-top: 10px;
          line-height: 26px;
          font-size: 14px;
          word-wrap: break-word;
          // box-sizing: border-box;
        }

        footer.discussion-post-info {
          font-size: 0.8em;
          height: 70px;

          &.fixed {
            position: fixed;
            transition: transform ease 0.2s;
            padding-bottom: 5px;
            bottom: -30px;
            z-index: 10;
            transform: translateY(-30px);
          }

          div.discussion-post-date {
            color: grey;
            line-height: 3em;
          }

          div.button-right-container {
            display: inline-block;
            position: absolute;
            right: 0;
          }
        }
      }
    }
  }
  button.button {
    margin: 2px;
    padding: 0.5em 0.8em 0.5em 0.8em;
    line-height: 1.2em;
    border: none;
    &:first-child {
      margin-left: 0;
    }
  }
  button.button.quote-button {
    z-index: 1;
    font-size: 14px;
    transition: none;
  }

  button.right {
    float: right;
  }

  button.vote-up::before { content: '👍 '; }
  button.vote-down::before { content: '👎 '; }

  div.unread-message {
    text-align: center;
    font-size: 1.1em;
    line-height: 80px;
    color: grey;
    cursor: pointer;
  }


  div.discussion-post-attachments {
    display: block;
    font-size: 14px;
    align-self: flex-end;
    // width: 0;
    // height: 0;
    z-index: 5;

    min-width: 0;
    margin-top: 12px;

    div.attachment-wrapper {
      padding: 12px;
      border-radius: 8px;
      // width: 100%
    }

    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 20px;
      // color: $theme_color;
    }

    ul.attachment-list {
      // list-style: none;
      margin-top: 10px;
      // FIXME:
      // transform: translateX(calc(-50% + 34px));
      // width: 250px;
      padding-left: 20px;
      // padding: 1em;
      // border-radius: 5px;
      // box-shadow: 0 0 5px #888;
      // background: white;
    }

    li.attachment-item {
      line-height: 20px;
      font-family: monospace;
      a {
        margin-right: .5em;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

.light-theme div.discussion-view {
  li.highlight {
    background-color: rgba(255, 255, 0, 0.15);
  }
  button.button {
    background-color: mix($theme_color, white, 10%);
    color: $theme_color;
  }
  button.button:hover {
    background-color: mix($theme_color, white, 20%);
  }
  div.discussion-post-container {
    border-bottom: mix($theme_color, white, 10%) solid 1px;
  }
  footer.discussion-post-info.fixed {
    background-color: rgba(white, 0.9);
  }
  button.button.quote-button {
    color: mix($theme_color, white, 10%);
    background-color: mix($theme_color, white, 90%);
  }
  div.attachment-wrapper {
    border: 2px dotted mix(white, $theme_color, 85%);
    background-color: mix(white, $theme_color, 95%);
  }
  li.attachment-item a {
    color: $theme_color;
  }
}

.dark-theme div.discussion-view {
  color: lightgrey;
  li.highlight {
    background-color: rgba(255, 255, 0, 0.1);
  }
  button.button {
    background-color: #444;
    color: white;
  }
  button.button:hover {
    background-color: #555;
  }
  div.discussion-post-container {
    border-bottom:  solid 1px #444;
  }
  footer.discussion-post-info.fixed {
    background-color: rgba(#222, 0.9);
  }
  button.button.quote-button {
    color: #222;
    background-color: #aaa;
  }
  div.attachment-wrapper {
    border: 2px dotted #555;
    background-color: #333;
  }
}
</style>
