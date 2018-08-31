<template lang="pug">
div
  loading-icon(v-if="busy && !member._id", style="margin-top: 20px;")
  div.member-info(v-if="member._id")
    div.avatar
      div.avatar-image(v-if="member.avatar" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
      div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
    div.name-and-bio-container
      h1.member-name {{ member.username }}
      h2.member-bio(:title="member.bio") {{ member.bio }}
      div.member-other-info 加入于{{ timeAgo(member.regdate) }} | 最后访问于{{ timeAgo(member.lastlogintime) }}
  div.member-activity(v-if="member._id")
    div.member-activity-container
      div.member-side-nav
        div: router-link(:to="`/m/${$route.params.memberId}`"): button.button(v-bind:class="{ active: $route.meta.mode === 'posts' }") 最近的活动
        div: router-link(:to="`/m/${$route.params.memberId}/discussions`"): button.button(v-bind:class="{ active: $route.meta.mode === 'discussions' }") 创建的讨论
        div(v-if="$route.params.memberId === $store.state.me._id"): router-link(:to="`/m/${$route.params.memberId}/settings`"): button.button(v-bind:class="{ active: $route.meta.mode === 'settings' }") 个人设置
        div(v-else): router-link(:to="`/message/new/${$route.params.memberId}`"): button.button 开始对话
      div.member-recent-activity(v-if="$route.meta.mode === 'posts'")
        ul: li.activity-item(v-for="activity in member.recentActivities")
          span.activity-time {{ timeAgo(activity.posts.createDate) }}
            span.activity-type(v-if="activity.posts.index === 1") 发起讨论：
            span.activity-type(v-else) 发表回复：
          router-link(:to="`/d/${activity._id}/${indexToPage(activity.posts.index)}#index-${activity.posts.index}`"): h3.discussion-title {{ activity.title }}
          div.activity-info
            div.activity-member-info
              router-link(:to="'/m/' + member._id").discussion-post-avater: div.discussion-post-avater
                div.avatar-image(v-if="member.avatar" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
                div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
              div.activity-member-name
                b {{ member.username }} 
            post-content(:content="activity.posts.content" noattach="true" :reply-to="activity.posts.replyTo" :discussion-id="activity._id")
        div.list-nav(v-if="canLoadMoreActivities")
          loading-icon(v-if="busy")
          button.button.load-more(@click="loadMoreRecentActivity" v-if="!busy") 加载更多
        div.list-nav(v-else): span.already-max 没有更多了
      div.member-recent-posts(v-if="$route.meta.mode === 'discussions'")
        discussion-list(:hideavatar="true" :list="member.discussions") 
        loading-icon(v-if="busy")
        div.list-nav(v-if="canLoadMorePosts")
          button.button.load-more(@click="loadMore" v-if="!busy") 加载更多
        div.list-nav(v-else): span.already-max 没有更多了
      div.member-settings(v-if="$route.meta.mode === 'settings' && $route.params.memberId === $store.state.me._id")
        h3 账户设置
        div.row
          button.button(@click="resetPassword") 修改密码
          button.button(@click="changeEmail") 变更邮箱
          button.button(@click="updateBio") 修改简介
          router-link(:to="`/m/${$route.params.memberId}/change-avatar`"): button.button(@click="selectAvatarFile") 更换头像
        h3 邮件通知
        div.row
          check-box(:checked="false")
          span 当我的话题被回复时
        div.row
          check-box(:checked="false")
          span 当我被人提及时
        div.row
          check-box(:checked="false")
          span 当我订阅的话题有更新时
        h3 浏览选项
        div.row
          check-box(:checked="settings.autoLoadOnScroll" v-on:click.native="updateSetting('autoLoadOnScroll', !settings.autoLoadOnScroll)")
          span 在讨论页面中使用实验性的滚动自动加载
        div.row
          check-box(:checked="settings.nightmode" v-on:click.native="updateSetting('nightmode', !settings.nightmode)")
          span 启用夜间模式（黑色主题）
        div.row
          check-box(:checked="settings.nofixedtoolbar" v-on:click.native="updateSetting('nofixedtoolbar', !settings.nofixedtoolbar)")
          span 浏览讨论时不要总是在页面底部显示功能栏
        h3 编辑选项
        div.row
          check-box(:checked="settings.newlineAfterAttachmentInsert" v-on:click.native="updateSetting('newlineAfterAttachmentInsert', !settings.newlineAfterAttachmentInsert)")
          span 插入附件后自动换行
        h3 隐私设置
        div.row
          check-box(:checked="false")
          span 允许站内用户查看我的电子邮件地址
        div.row
          check-box(:checked="false")
          span 公开我的在线状态
        h3 调试
        div.row
          button.button(@click="sudo") 提权至管理员
          button.button(@click="emitNotification('message')") 弹出消息通知
          button.button(@click="emitNotification('error')") 弹出错误通知
          button.button(@click="createMessageBox('OK')") 弹出普通窗口
          button.button(@click="createMessageBox('OKCANCEL')") 弹出询问窗口
          button.button(@click="createMessageBox('INPUT')") 弹出输入文本窗口
          button.button(@click="createMessageBox('PASSWORD')") 弹出输入密码窗口
      div.member-upload-avatar(v-show="$route.meta.mode === 'avatar' && $route.params.memberId === $store.state.me._id")
        h3 上传头像
        input(type="file", style="display: none", v-on:change="startPreview($event)")
        div.avatar-picker
          div.picker
            button.button(@click="selectAvatarFile", v-if="localImageUrl === ''") 单击选择图片
            div.cut-tool(v-else)
              img(:src="localImageUrl" draggable="false")
              div.cut-indicator(v-bind:style="cutIndicatorStyle" v-on:mousedown="beginDrag")
              input.scale(type="range" min="10" max="100" setp="5" v-model="cutState.scale")
          //- div.preview
          //-   div.avatar
          //-     div.avatar-image(v-if="member.avatar" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
          //-     div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
          //-   span.info 当前头像
        div.button-container(v-if="localImageUrl !== ''")
          button.button(@click="selectAvatarFile") 重新选择
          button.button(@click="uploadAvatar") 确定提交
</template>

<script>
import LoadingIcon from '../components/LoadingIcon.vue';
import CheckBox from '../components/form/CheckBox.vue';
import PostContent from '../components/PostContent.vue';
import DiscussionList from '../components/DiscussionList.vue';
import api from '../api';
import titleMixin from '../mixins/title.js';
import axios from 'axios';

import { timeAgo, indexToPage } from '../utils/filters';

import bus from '../utils/ws-eventbus';

export default {
  name: 'member-view',
  mixins: [titleMixin],
  components: {
    LoadingIcon, PostContent, DiscussionList, CheckBox,
  },
  data () {
    return {
      currentPage: 1,
      canLoadMorePosts: true,
      canLoadMoreActivities: true,
      currentMember: null,
      firstIn: true,
      localImageUrl: '',
      cutIndicatorStyle: {},
      cutState: {
        scale: 100,
      },
      dragState: {
        beginMouseX: 0,
        beginMouseY: 0,
        beginIndicatorX: 0,
        beginIndicatorY: 0,
      },
    };
  },
  title () {
    if (this.busy) {
      return 'Loading';
    }
    switch (this.$route.meta.mode) {
      case 'posts':
        return `${this.member.username} 的最近活动`;
      case 'discussions':
        return `${this.member.username} 创建的讨论`;
      case 'settings':
        return '个人设置';
    }
  },
  computed: {
    member () {
      return this.$store.state.member;
    },
    busy () {
      return this.$store.state.busy;
    },
    discussions () {
      return this.$store.state.member.discussions;
    },
    me () {
      return this.$store.state.me;
    },
    settings () {
      return this.$store.state.settings;
    },
  },
  methods: {
    timeAgo, indexToPage,
    loadMore () {
      this.currentPage++;
      this.$store.dispatch('fetchDiscussionsCreatedByMember', { id: this.$route.params.memberId, page: this.currentPage, append: true }).then(count => {
        if (indexToPage(count) <= this.currentPage) {
          this.canLoadMorePosts = false;
        }
      });
    },
    updateSetting (key, value) {
      this.$store.dispatch('showMessageBox', {
        title: '请稍等',
        type: '',
        message: '正在更新设置，请稍等……',
      });
      this.$store.dispatch('updateSetting', { key, value }).then(() => {
        this.$store.dispatch('disposeMessageBox');
      });
    },
    loadMoreRecentActivity () {
      if (!this.canLoadMoreActivities) {
        return;
      }

      this.$store.commit('setBusy', true);

      const lastDate = this.member.recentActivities[this.member.recentActivities.length - 1].posts.createDate;
      api.v1.member.fetchMoreMemberRecentActivityById({ id: this.member._id, before: lastDate }).then(({ recentActivities, members }) => {
        if (recentActivities.length === 0) {
          this.canLoadMoreActivities = false;
        } else {
          this.$store.commit('appendMemberRecentActivity', recentActivities);
        }
        this.$store.commit('mergeMembers', members);
        this.$store.commit('setBusy', false);
      });
    },
    switchScrollBehavior () {
      this.$store.commit('switchScrollBehavior');
    },
    beginDrag (e) {
      this.dragState.beginMouseX = e.clientX;
      this.dragState.beginMouseY = e.clientY;
      this.dragState.beginIndicatorX = this.cutState.x;
      this.dragState.beginIndicatorY = this.cutState.y;
      document.addEventListener('mousemove', this.dragStep);
      document.addEventListener('mouseup', this.dragStop);
    },
    dragStep (e) {
      this.cutState.x = this.dragState.beginIndicatorX + (e.clientX - this.dragState.beginMouseX);
      this.cutState.y = this.dragState.beginIndicatorY + (e.clientY - this.dragState.beginMouseY);
      this.updateCutIndicatorStyle();
    },
    dragStop (e) {
      document.removeEventListener('mousemove', this.dragStep);
      document.removeEventListener('mouseup', this.dragStop);
    },
    selectAvatarFile () {
      this.$el.querySelector('input[type="file"]').click();
    },
    updateCutIndicatorStyle () {
      const maxSize = Math.min(this.cutState.showingWidth, this.cutState.showingHeight);
      if (this.cutState.size > maxSize) {
        this.cutState.size = maxSize;
      }
      if (this.cutState.x < 0) this.cutState.x = 0;
      if (this.cutState.y < 0) this.cutState.y = 0;
      if (this.cutState.x + this.cutState.size > this.cutState.showingWidth) this.cutState.x = this.cutState.showingWidth - this.cutState.size;
      if (this.cutState.y + this.cutState.size > this.cutState.showingHeight) this.cutState.y = this.cutState.showingHeight - this.cutState.size;
      this.cutIndicatorStyle = {
        top: this.cutState.y + this.cutState.topOffset + 'px',
        left: this.cutState.x + this.cutState.leftOffset + 'px',
        width: this.cutState.size + 'px',
        height: this.cutState.size + 'px',
        backgroundImage: `url(${this.localImageUrl})`,
        backgroundSize: `${this.cutState.showingWidth}px ${this.cutState.showingHeight}px`,
        backgroundPosition: `${-this.cutState.x}px ${-this.cutState.y}px`,
      };
    },
    startPreview (event) {
      const input = this.$el.querySelector('input[type="file"]');
      const previewSize = 320;

      if (input.files && input.files[0]) {
        const blob = new window.Blob([input.files[0]]);
        this.localImageUrl = window.URL.createObjectURL(blob);

        setTimeout(() => {
          const image = this.$el.querySelector('img');

          this.cutState.imgWidth = image.naturalWidth;
          this.cutState.imgHeight = image.naturalHeight;

          let ratio = this.cutState.ratio = previewSize / Math.max(this.cutState.imgWidth, this.cutState.imgHeight);

          let showingWidth = this.cutState.showingWidth = this.cutState.imgWidth * ratio;
          let showingHeight = this.cutState.showingHeight = this.cutState.imgHeight * ratio;

          this.cutState.leftOffset = (previewSize - showingWidth) / 2;
          this.cutState.topOffset = (previewSize - showingHeight) / 2;
          this.cutState.x = 0;
          this.cutState.y = 0;
          this.cutState.size = Math.min(showingWidth, showingHeight);

          this.updateCutIndicatorStyle();
        }, 200);
      }
    },
    sudo () {
      axios.get('/api/v1/debug/sudo').then(() => {
        bus.$emit('notification', {
          type: 'message',
          body: '提权成功，即将刷新页面以激活变更…',
        });
        setTimeout(() => window.location.reload(), 3000);
      });
    },
    emitNotification (type) {
      bus.$emit('notification', {
        type,
        body: navigator.userAgent,
      });
    },
    createMessageBox (type) {
      this.$store.dispatch('showMessageBox', {
        title: '这是个标题',
        type,
        message: '这是正文',
      }).then(res => {
        bus.$emit('notification', {
          type: 'message',
          body: '确认！返回内容：' + res,
        });
      }).catch(() => {
        bus.$emit('notification', {
          type: 'error',
          body: '取消！',
        });
      });
    },
    uploadAvatar () {
      let source = axios.CancelToken.source();

      this.$store.dispatch('showMessageBox', {
        title: '上传中',
        type: 'CANCEL',
        message: '正在上传（0%）',
      }).catch(() => {
        source.cancel('用户取消上传');
      });

      api.v1.member.uploadAvatar({
        file: this.$el.querySelector('input[type="file"]').files[0],
        x: Math.floor(this.cutState.x / this.cutState.ratio),
        y: Math.floor(this.cutState.y / this.cutState.ratio),
        w: Math.floor(this.cutState.size / this.cutState.ratio),
      }, {
        onUploadProgress: e => {
          this.$store.dispatch('updateMessageBox', {
            title: '上传中',
            message: `正在上传（${(100 * e.loaded / e.total).toFixed(2)}%）`,
          });
        },
        cancelToken: source.token,
      }).then(() => {
        this.$store.dispatch('disposeMessageBox');
        return this.$store.dispatch('showMessageBox', {
          title: '上传成功',
          type: 'OK',
          message: '文件上传成功，您的头像已经更新。',
        }).then(() => {
          window.history.go(-1);
          this.reloadMemberInfo();
        });
      }).catch(error => {
        this.$store.dispatch('disposeMessageBox');
        console.error(error);
        bus.$emit('notification', {
          type: 'error',
          body: error.message,
        });
      });
    },
    updateBio () {
      this.$store.dispatch('showMessageBox', {
        title: '修改个人简介',
        type: 'INPUT',
        message: '说说你自己吧：',
      }).then(res => {
        this.$store.dispatch('showMessageBox', {
          title: '请稍等',
          type: '',
          message: '正在更新个人简介，请稍等……',
        });
        api.v1.member.updateMemberInfo({ bio: res }).then(() => {
          bus.$emit('notification', {
            type: 'message',
            body: '修改成功',
          });
          this.reloadMemberInfo();
        }).catch(error => {
          console.error(error);
          bus.$emit('notification', {
            type: 'error',
            body: '发生错误，查看 JavaScript 控制台查看详情。',
          });
        }).finally(() => {
          this.$store.dispatch('disposeMessageBox');
        });
      }).catch(() => {
        // 用户取消
      });
    },
    reloadMemberInfo () {
      this.$store.dispatch('fetchCurrentSigninedMemberInfo');
      this.$store.dispatch('fetchMemberInfo', { id: this.$route.params.memberId }).then(() => {
        // this.updateTitle();
      });
    },
    changeEmail () {
      this.$store.dispatch('showMessageBox', {
        title: '修改邮箱',
        type: 'INPUT',
        message: '输入新的邮箱，我们将会向新的邮箱地址发送一个验证码以确保可用：',
      }).then(email => {
        api.v1.member.verifyEmailAddress({ email }).then(() => {
          this.$store.dispatch('showMessageBox', {
            title: '修改邮箱',
            type: 'INPUT',
            message: '验证码已发送，请前往邮箱查看',
          }).then(token => {
            api.v1.member.changeEmailAddress({ token }).then(() => {
              bus.$emit('notification', {
                type: 'message',
                body: '邮箱修改成功！',
              });
            }).catch(error => {
              bus.$emit('notification', {
                type: 'error',
                body: '服务端返回异常，查看 JavaScript 控制台查看详情！',
              });
              console.error(error);
            });
          }).catch(e => { /* doing nothing after user cancel */ });
        }).catch(e => {
          if (e.response.data.message === 'validation error') {
            bus.$emit('notification', {
              type: 'error',
              body: '邮箱地址无效，修改邮箱已终止。',
            });
          }
        });
      }).catch(ex => { /* doing nothing after user cancel */ });
    },
    resetPassword () {
      this.$store.dispatch('showMessageBox', {
        title: '修改密码',
        type: 'PASSWORD',
        message: '输入新的密码：',
      }).then(res => {
        this.$store.dispatch('showMessageBox', {
          title: '请稍等',
          type: '',
          message: '正在更新密码，请稍等……',
        });
        api.v1.member.resetPassword({ password: res }).then(() => {
          bus.$emit('notification', {
            type: 'message',
            body: '密码修改成功！',
          });
        }).catch(error => {
          bus.$emit('notification', {
            type: 'error',
            body: '服务端返回异常，查看 JavaScript 控制台查看详情！',
          });
          console.error(error);
        }).finally(() => {
          this.$store.dispatch('disposeMessageBox');
        });
      }).catch(() => {
        // doing nothing.
      });
    },
  },
  created () {
    this.currentPage = 1;
    this.currentMember = this.$route.params.memberId;
  },
  watch: {
    '$route': function (route) {
      console.log(this.$store.state.member.discussions);
      if (typeof this.currentMember === 'undefined' || this.currentMember !== route.params.memberId || this.firstIn) {
        // 如果 currentMember 和路由中的 member 不一致时，显然可以算作是首次进入。
        let needRefetchMemberInfo = (this.currentMember !== route.params.memberId);
        this.firstIn = false;
        if (route.params.memberId) {
          this.currentMember = route.params.memberId;
          if (needRefetchMemberInfo) {
            this.canLoadMorePosts = true;
            this.$store.dispatch('fetchMemberInfo', { id: route.params.memberId }).then(() => {
              if (route.meta.mode === 'discussions') {
                return this.$store.dispatch('fetchDiscussionsCreatedByMember', { id: route.params.memberId });
              } else {
                return Promise.resolve();
              }
            }).then(() => {
              // this.updateTitle();
            });
          } else if (this.$store.state.member.discussions === undefined) {
            this.$store.dispatch('fetchDiscussionsCreatedByMember', { id: route.params.memberId }).then(() => {
              this.$forceUpdate();
            });
          }
          this.currentPage = 1;
        }
        return;
      }
      if (route.params.memberId && route.meta.mode === 'discussions' && this.$store.state.member.discussions === undefined) {
        this.$store.dispatch('fetchDiscussionsCreatedByMember', { id: route.params.memberId });
      }
      // this.updateTitle();
    },
    'cutState.scale': function () {
      const maxSize = Math.min(this.cutState.showingWidth, this.cutState.showingHeight);
      const diff = (maxSize * Number(this.cutState.scale) / 100 - this.cutState.size) / 2;
      this.cutState.size = maxSize * Number(this.cutState.scale) / 100;
      this.cutState.x -= diff;
      this.cutState.y -= diff;
      this.updateCutIndicatorStyle();
    },
  },
  activated () {
    if (this.$store.state.member && this.$store.state.member._id !== this.$route.params.memberId) {
      // this.$options.asyncData({ store: this.$store, route: this.$route });
      this.firstIn = true;
      this.canLoadMorePosts = true;
    }
    this.$store.commit('setGlobalTitles', [' ', ' ', true]);
    // this.updateTitle();
  },
  asyncData ({ store, route }) {
    return store.dispatch('fetchMemberInfo', { id: route.params.memberId }).then(() => {
      if (route.meta.mode === 'discussions') {
        return store.dispatch('fetchDiscussionsCreatedByMember', { id: route.params.memberId });
      }
    }).then(() => {
      // this.updateTitle();
    });
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';
@import '../styles/load-more-button.scss';

div.member-info {
  text-align: left;
  $avatar-size: 120px;
  display: flex;
  padding: 0 15px;
  @include respond-to(phone) {
    flex-direction: column;
    align-items: center;
    height: 270px;
    box-sizing: content-box;
    margin-top: -270px;
  }
  > * {
    @include respond-to(laptop) {
      margin-top: -$avatar-size / 2;
    }
    @include respond-to(tablet) {
      margin-top: -$avatar-size / 2;
    }
  }
  div.avatar {
    width: $avatar-size;
    height: $avatar-size;
    position: relative;
    border-radius: $avatar-size / 2;
    overflow: hidden;
    display: inline-block;
    box-shadow: 0 0 10px black;
    flex-grow: 0;
    flex-shrink: 0;
    div.avatar-image, div.avatar-fallback {
      position: absolute;
      width: 100%;
      height: 100%;
      line-height: $avatar-size;
    }
    div.avatar-image {
      z-index: 2;
      background-position: center;
      background-size: cover;
      background-repeat: no-repeat;
    }
    div.avatar-fallback {
      background-color: $theme_color;
      text-align: center;
      color: white;
      font-size: $avatar-size * 0.5;
    }
  }

  div.name-and-bio-container {
    display: inline-block;
    flex-grow: 1;
    flex-shrink: 1;
    padding-left: 1em;
    vertical-align: top;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    @include respond-to(phone) {
      width: 100%;
      padding: 0.2em;
      text-align: center;
    }
    h1.member-name {
      font-weight: 300;
      margin: 0;
      line-height: $avatar-size / 2;
      height: $avatar-size / 2;
      display: inline-block;
      color: white;
      text-shadow: 0 0 5px black;
    }
    h2.member-bio {
      font-weight: normal;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 16px;
      margin: 0;
      line-height: $avatar-size / 4;
      @include respond-to(phone) {
        color: white;
        text-shadow: 0 0 5px black;
      }
    }
    div.member-other-info {
      // color: #888;
      font-size: 14px;
      line-height: $avatar-size / 4;
      height: $avatar-size / 4;
      @include respond-to(phone) {
        color: white;
        text-shadow: 0 0 5px black;
      }
    }
  }
}

div.member-activity {
  text-align: left;

  div.member-activity-container {
    margin-top: 10px;
    display: flex;
    @include respond-to(phone) {
      flex-direction: column;
    }

    div.member-side-nav {
      flex-grow: 0;
      flex-shrink: 0;
      order: 1;
      text-align: center;
      line-height: 20px;
      padding: 0.3rem;

      @include respond-to(tablet) {
        width: 120px;
      }
      @include respond-to(laptop) {
        padding-top: 20px;
        width: 120px;
      }

      @include respond-to(phone) {
        display: flex;
      }

      a {
        cursor: pointer;
        font-size: 0.9em;
        line-height: 0.9em;
        color: white;
      }

      button.button {
        margin: 0.3rem;
        padding: 0.3em 0.5em;
        width: 100px;
        border: none;

        &:focus {
          outline: none;
        }
      }
    }

    div.member-recent-activity {
      min-width: 0;
      padding: 0 20px;
      box-sizing: border-box;
    }

    div.member-recent-activity h3.discussion-title {
      font-weight: 400;
      font-size: 18px;
      margin: 5px 0;
    }

    div.member-settings, div.member-upload-avatar {
      padding: 10px 20px;
      box-sizing: border-box;
    }

    div.member-upload-avatar {
      user-select: none;

      button.button {
        border: none;
        font-size: 14px;
      }

      div.avatar-picker {
        display: flex;
      }

      $box-size: 320px;
      $margin-len: 70px;

      div.button-container {
        display: flex;
        width: $box-size;
        padding: 1em;
        box-sizing: border-box;
        justify-content: space-around;
        button {
          padding-left: 1em;
          padding-right: 1em;
        }
      }

      div.picker, div.preview {
        width: $box-size;
        height: $box-size;
        line-height: $box-size;
        text-align: center;
      }
      div.picker {
        button.button {
          padding: 1em 2em;
        }

        div.cut-tool {
          position: relative;
          width: 100%;
          height: 100%;
          background: black;

          img {
            position: absolute;
            margin: auto;
            top: 0; left: 0;
            right: 0; bottom: 0;
            max-width: 100%;
            max-height: 100%;
            filter: brightness(0.5);
          }

          input.scale {
            position: absolute;
            z-index: 5;
            transform: rotate(-90deg) translateX(-160px) translateY(120px);
            transform-origin: center;
          }

          div.button-container {
            position: absolute;
            margin: auto;
            top: 0; left: 0;
            right: 0; bottom: 0;
          }
        }

        div.cut-indicator {
          position: absolute;
          border-radius: 50%;
        }
      }

      div.preview {
        position: relative;
        .avatar, .avatar-image, .avatar-fallback {
          width: $box-size - $margin-len * 2;
          height: $box-size - $margin-len * 2;
          line-height: $box-size - $margin-len * 2;
        }
        .avatar {
          margin: $margin-len;
          border-radius: ($box-size - $margin-len) / 2;
          overflow: hidden;
        }
        .avatar-image {
          background-size: cover;
        }
        .avatar-fallback {
          background-color: $theme_color;
        }
        span.info {
          position: absolute;
          user-select: none;
          line-height: 1em;
          bottom: 20px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 14px;
          color: #888;
        }
      }
    }

    div.member-settings {
      .row {
        display: flex;
        width: 100%;
        overflow: hidden;
        align-items: center;
        &:not(:first-child) {
          margin-bottom: 8px;
        }
        span {
          font-size: 15px;
          vertical-align: middle;
          margin-left: .8em;
        }
        button.button {
          font-size: 14px;
          border: none;
          padding: 6px 14px;
          margin-right: 5px;
        }
      }
      h3 {
        margin: 1.5em 0 0.9em 0;
        padding: 0;
        font-size: 14px
      }
    }

    div.member-recent-activity, div.member-recent-posts, div.member-settings, div.member-upload-avatar {
      flex-grow: 1;
      flex-shrink: 1;
      order: 2;
      width: 100%;

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      span.activity-time {
        display: block;
        color: #bbb;
        font-size: 12px;
      }

      li.activity-item {
        display: block;
        padding-bottom: 24px;
        margin-bottom: 12px;

        div.post-content {
          padding: 10px 0;
          font-size: 14px;
        }
      }

      div.activity-info {
        display: flex;
        flex-direction: column;
        overflow: show;
      }

      div.activity-member-info {
        display: flex;
        align-items: center;
      }

      div.activity-member-name {
        @include respond-to(phone) {
          padding-left: 8px;
        }
      }

      @mixin set-avatar ($avatar-size) {
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
        $avatar-padding: 12px;
        .activity-info {
          padding-left: $avatar-size + $avatar-padding;
        }
        a.discussion-post-avater {
          width: 0;
          height: 0;
        }
        div.discussion-post-avater {
          margin-left: -$avatar-size - $avatar-padding;
          margin-top: -4px;
        }
      }

      @include respond-to(phone) {
        @include set-avatar(32px);
      }
      @include respond-to(tablet) {
        @include set-avatar(50px);
        @include set-avatar-outside(50px);
      }
      @include respond-to(laptop) {
        @include set-avatar(60px);
        @include set-avatar-outside(60px);
      }

      a.discussion-post-avater {
        display: block;
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
    }
  }

  div.list-nav {
    padding-bottom: 16px;
  }

  span.already-max {
    font-size: 0.85em;
    color: #888;
  }
}

.dark-theme div.member-info, .dark-theme div.member-activity {
  color: #ccc;
  a {
    color: white;
  }
  li.activity-item:not(:last-child) {
    border-bottom: 1px solid #555;
  }
  .member-settings, .member-upload-avatar {
    button {
      color: white;
      background: #444;
      &:hover {
        color: white;
        background: #555;
      }
    }
  }
  div.member-side-nav {
    button.button.active {
      background: #444;
      color: white;
    }

    button.button {
      background: rgba(0, 0, 0, 0);
      color: lightgrey;
    }
  }
}

.light-theme div.member-info, .light-theme div.member-activity {
  a {
    color: $theme_color;
  }
  li.activity-item:not(:last-child) {
    border-bottom: 1px solid rgba($theme_color, 0.3);
  }
  .member-settings, .member-upload-avatar {
    button {
      color: mix($theme_color, black, 90%);
      background: mix($theme_color, white, 15%);
      &:hover {
        color: mix($theme_color, black, 60%);
        background: mix($theme_color, white, 20%);
      }
    }
  }
  div.member-side-nav {
    button.button.active {
      background: $theme_color;
      color: white;
    }

    button.button {
      background: rgba(0, 0, 0, 0);
      color: $theme_color;
    }
  }
}
</style>
