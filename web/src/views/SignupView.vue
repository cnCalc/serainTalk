<template lang="pug">
  div.signup-view
    div.signup-box
      form(v-on:submit.prevent="doPrepareSignUp" v-if="!hasToken")
        h2 注册
        .explain 这里是一段解释说明的文本
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
  name: 'singup-view',
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
    // this.updateTitle();
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
        window.alert('发送失败！查看 JavaScript 控制台确认问题！');
        console.error(err);
      });
    },
    doPerformSignup () {
      api.v1.member.performSignup({
        username: this.credentials.username,
        password: this.credentials.password,
        token: this.token,
      }).then(() => {
        window.alert('注册成功');
        this.$router.push('/signin');
      }).catch(err => {
        window.alert('失败！查看 JavaScript 控制台确认问题！');
        console.error(err);
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
    margin: 100px auto 0 auto;
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
