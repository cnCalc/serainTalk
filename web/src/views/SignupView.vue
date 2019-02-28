<template lang="pug">
  div.signup-view
    div.signup-box
      form(v-on:submit.prevent="doPrepareSignUp" v-if="!hasToken")
        h2 注册
        .explain
          div 用户在本论坛所发贴子内容版权归用户和论坛共有，如需转载必须注明作者和原贴地址。一切用户言论仅代表用户个人看法，本论坛不为此负责。
          div 邮件地址仅用于订阅讨论、通知发送和找回密码，默认情况下不会公开。
        label.block(for="email") 电子邮件地址：
        input(id="email", type="text", v-model="email", :readonly="busy" autocomplete="email")
        button.button(:disabled="busy") 验证邮件地址
        div.quick-action-wrapper
          router-link(to="/signin") 前往登录
          router-link(:to="`/migration?next=${encodeURIComponent($route.query.next || path)}`") 账户迁移
          router-link(to="/reset-password") 忘记密码
      form(v-on:submit.prevent="doPerformSignup" v-else)
        h2 完成注册
        .explain 说明文本
        label.block(for="token") 验证码：
        input(id="token", type="text", v-model="token", :readonly="busy")
        label.block(for="username") 用户名：
        input(id="username", type="text", v-model="credentials.username", :readonly="busy")
        label.block(for="password") 登录密码：
        input(id="password", type="password", v-model="credentials.password", :readonly="busy")
        button.button(:disabled="busy") 完成注册
</template>

<script>
import api from '../api';
import titleMixin from '../mixins/title';
// import bus from '../utils/ws-eventbus';

export default {
  name: 'SingupView',
  mixins: [titleMixin],
  data () {
    return {
      credentials: {
        name: '',
        password: '',
      },
      email: '',
      hasToken: false,
      token: '',
    };
  },
  title: '注册',
  computed: {
    busy () {
      return this.$store.state.busy;
    },
    path () {
      return this.$route.fullPath;
    },
  },
  beforeMount () {
    this.$store.commit('setGlobalTitles', []);
  },
  mounted () {
    if (this.$route.query.token) {
      this.hasToken = true;
      this.token = this.$route.query.token;
    }
  },
  methods: {
    doPrepareSignUp () {
      api.v1.member.prepareSignup({ email: this.email }).then(() => {
        window.alert('发送成功！');
        this.hasToken = true;
      }).catch(err => {
        console.error(err);

        const res = err.response;
        const data = res.data;
        let message = '未知错误！查看 JavaScript 控制台确认问题！';

        if (data.code === 'ERR_EMAIL_USED') {
          message = '邮箱地址已被使用，请使用其他邮箱地址重试。';
        }

        this.$store.dispatch('showMessageBox', {
          title: '出现错误',
          type: 'OK',
          message,
        }).then(() => {});
      });
    },
    doPerformSignup () {
      api.v1.member.performSignup({
        username: this.credentials.username,
        password: this.credentials.password,
        token: this.token,
      }).then(() => {
        this.$store.dispatch('showMessageBox', {
          type: 'OK',
          message: '注册成功',
        }).then(() => {});

        this.$router.push('/signin');
      }).catch(err => {
        console.error(err);

        const res = err.response;
        const data = res.data;
        let message = '未知错误！查看 JavaScript 控制台确认问题！';

        if (data.code === 'ERR_MEMBER_EXIST') {
          message = '用户名已被注册，请使用其他用户名重试。';
        } else if (data.code === 'ERR_WRONG_VERIFICATION_CODE') {
          message = '验证码无效，请核对验证码是否正确，或刷新页面重试';
        }

        this.$store.dispatch('showMessageBox', {
          title: '出现错误',
          type: 'OK',
          message,
        }).then(() => {});
      });
    },
  },
};
</script>


<style lang="scss">
@import '../styles/global.scss';

div.signup-view {
  font-size: 13px;

  div.signup-box {
    text-align: left;
    display: inline-block;
    margin: 60px auto 0 auto;
    padding: 0 10px;
    width: 300px;
    box-sizing: border-box;
  }

  label.block {
    display: block;
  }

  label {
    text-align: initial;
    margin-top: 20px;
  }

  input[type="text"], input[type="password"] {
    width: 100%;
    box-sizing: border-box;
    border-radius: 2px;
    font-size: 1em;
    padding: 6px 8px;
  }

  input:focus {
    outline: none;
  }

  .explain {
    margin-top: 1em;
    margin-bottom: 1em;
    width: 100%;
    div + div {
      margin-top: 6px;
    }
  }

  h2 {
    font-size: 2em;
    font-weight: normal;
    text-align: left;
  }

  div.remember-wrapper {
    margin-top: 5px;
  }

  button.button {
    margin: 20px 0;
    width: 100%;
    border: none;
  }

  a {
    margin-right: 1em;
  }

  a, label, input, h2 {
    transition: all ease 0.3s;
  }
}

.light-theme div.signup-view {
  input[type="text"], input[type="password"] {
    border: 1px solid #ccc;
  }

  button.button {
    background-color: $theme_color;
    color: white;

    &:disabled {
      background-color: mix(white, $theme_color, 50%);
    }
  }

  a {
    color: $theme_color;
  }

  label {
    color: black;
  }
}

.dark-theme div.signup-view {
  color: white;

  input[type="text"], input[type="password"] {
    border: 1px solid #444;
    background-color: #444;
    color: white;
  }

  button.button {
    background-color: #444;
    color: white;

    &:disabled {
      background-color: mix(black, #444, 25%);
      color: grey;
    }
  }

  a {
    color: #888;
  }

  label {
    color: white;
  }
}


</style>
