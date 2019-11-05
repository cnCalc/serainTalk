<template lang="pug">
  div.member-settings(v-if="$route.params.memberId === $store.state.me._id")
    h3 账户设置
    div.row.wrap
      button.button(@click="resetPassword") 修改密码
      button.button(@click="changeEmail") 变更邮箱
      button.button(@click="updateBio") 修改简介
      router-link(:to="`/m/${$route.params.memberId}/change-avatar`"): button.button 更换头像
    h3 邮件通知
    div.row
      check-box(:checked="settings.discussionReplyMailNotification" v-on:click.native="updateSetting('discussionReplyMailNotification', !settings.discussionReplyMailNotification)")
      span 当我的话题被回复时
    div.row
      check-box(:checked="settings.postReplyMailNotification" v-on:click.native="updateSetting('postReplyMailNotification', !settings.postReplyMailNotification)")
      span 当我的跟帖被回复时
    div.row
      check-box(:checked="settings.mentionMailNotification" v-on:click.native="updateSetting('mentionMailNotification', !settings.mentionMailNotification)")
      span 当我被人提及时
    div.row
      check-box(:checked="settings.subscriptionMailNotification" v-on:click.native="updateSetting('subscriptionMailNotification', !settings.subscriptionMailNotification)")
      span 当我订阅的话题有更新时
    h3 浏览选项
    div.row
      check-box(:checked="settings.autoLoadOnScroll" v-on:click.native="updateSetting('autoLoadOnScroll', !settings.autoLoadOnScroll)")
      span 在讨论页面中使用实验性的滚动自动加载
    div.row
      check-box(:checked="settings.autoTheme" v-on:click.native="updateSetting('autoTheme', !settings.autoTheme)")
      span 启用实验性的主题自动切换
    div.row(v-if="!settings.autoTheme")
      check-box(:checked="settings.nightmode" v-on:click.native="updateSetting('nightmode', !settings.nightmode)")
      span 启用夜间模式（黑色主题）
    div.row
      check-box(:checked="settings.nofixedtoolbar" v-on:click.native="updateSetting('nofixedtoolbar', !settings.nofixedtoolbar)")
      span 浏览讨论时不要总是在页面底部显示功能栏
    div.row
      check-box(:checked="settings.preferNewTab" v-on:click.native="updateSetting('preferNewTab', !settings.preferNewTab)")
      span 打开讨论页面时使用新标签而不是在当前标签跳转
    h3 编辑选项
    div.row
      check-box(:checked="settings.newlineAfterAttachmentInsert" v-on:click.native="updateSetting('newlineAfterAttachmentInsert', !settings.newlineAfterAttachmentInsert)")
      span 插入附件后自动换行
    h3 隐私设置
    div.row
      check-box(:checked="false")
      span 允许站内用户查看我的电子邮件地址
    div.row
      check-box(:checked="settings.allowShowOnlineStatus" v-on:click.native="updateSetting('allowShowOnlineStatus', !settings.allowShowOnlineStatus)")
      span 公开我的在线状态
    h3 调试
    div.row.wrap
      button.button(@click="sudo") 提权至管理员
      button.button(@click="emitNotification('message')") 弹出消息通知
      button.button(@click="emitNotification('error')") 弹出错误通知
      button.button(@click="createMessageBox('OK')") 弹出普通窗口
      button.button(@click="createMessageBox('OKCANCEL')") 弹出询问窗口
      button.button(@click="createMessageBox('INPUT')") 弹出输入文本窗口
      button.button(@click="createMessageBox('PASSWORD')") 弹出输入密码窗口
</template>

<script>
import CheckBox from './form/CheckBox.vue';
import api from '../api';
import axios from 'axios';

export default {
  components: {
    CheckBox,
  },
  data () {
    return {
    };
  },
  computed: {
    settings () {
      return this.$store.state.settings;
    },
  },
  methods: {
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
    switchScrollBehavior () {
      this.$store.commit('switchScrollBehavior');
    },
    sudo () {
      axios.get('/api/v1/debug/sudo').then(() => {
        this.bus.$emit('notification', {
          type: 'message',
          body: '提权成功，即将刷新页面以激活变更…',
        });
        setTimeout(() => window.location.reload(), 3000);
      });
    },
    emitNotification (type) {
      this.bus.$emit('notification', {
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
        this.bus.$emit('notification', {
          type: 'message',
          body: '确认！返回内容：' + res,
        });
      }).catch(() => {
        this.bus.$emit('notification', {
          type: 'error',
          body: '取消！',
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
        });console.log(123);
        api.v1.member.updateMemberInfo({ bio: res }).then(() => {
          this.bus.$emit('notification', {
            type: 'message',
            body: '修改成功',
          });
          this.reloadMemberInfo();
        }).catch(error => {
          console.error(error);
          this.bus.$emit('notification', {
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
              this.bus.$emit('notification', {
                type: 'message',
                body: '邮箱修改成功！',
              });
            }).catch(error => {
              this.bus.$emit('notification', {
                type: 'error',
                body: '服务端返回异常，查看 JavaScript 控制台查看详情！',
              });
              console.error(error);
            });
          }).catch(e => { /* doing nothing after user cancel */ });
        }).catch(e => {
          if (e.response.data.message === 'validation error') {
            this.bus.$emit('notification', {
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
          this.bus.$emit('notification', {
            type: 'message',
            body: '密码修改成功！',
          });
        }).catch(error => {
          this.bus.$emit('notification', {
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
    reloadMemberInfo () {
      this.$store.dispatch('fetchCurrentSigninedMemberInfo');
      this.$store.dispatch('fetchMemberInfo', { id: this.$route.params.memberId }).then(() => {
        // this.updateTitle();
      });
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';
@import '../styles/load-more-button.scss';

</style>
