<template lang="pug">
  div.signin-view
    div.signin-box
      h2 登录 
      label.block(for="name") 用户名或电子邮件地址
      input(id="name", placeholder="", type="text", v-model="credentials.name")
      label.block(for="passwd") 密码
      input(id="passwd", placeholder="", type="password", v-model="credentials.password")
      div.remember-wrapper
        input(type="checkbox", id="remember", v-model="rememberMe")
        label(for="remember") 记住登录
      button.button(@click="doSignin") 登录
      div.quick-action-wrapper
        router-link(to="/signup") 前往注册
        router-link(to="/migration") 账户迁移
        router-link(to="/reset-password") 忘记密码
</template>

<script>
import api from '../api';

export default {
  name: 'singin-view',
  data () {
    return {
      credentials: {
        name: '',
        password: '',
      },
      rememberMe: false,
    };
  },
  beforeMount () {
    this.$store.commit('setGlobalTitles', []);
  },
  methods: {
    async doSignin () {
      api.v1.member.signin(this.credentials).then(response => {
        this.$store.commit('setCurrentSigninedMemberInfo', response.memberinfo);
      }).catch(e => {
        alert('密码错误');
      });
    }
  }
};
</script>


<style lang="scss">
@import '../styles/global.scss';

div.signin-view {
  font-size: 13px;

  div.signin-box {
    text-align: left;
    display: inline-block;
    margin: 100px auto 0 auto;
  }

  label.block {
    display: block;
  }

  label {
    text-align: initial;
    margin-top: 20px;
  }

  input[type="text"], input[type="password"] {
    width: 300px;
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

.light-theme div.signin-view {
  input[type="text"], input[type="password"] {
    border: 1px solid #ccc;
  }

  button.button {
    background-color: $theme_color;
    color: white;
  }

  a {
    color: $theme_color;
  }

  label {
    color: black;
  }
}

.dark-theme div.signin-view {
  input[type="text"], input[type="password"] {
    border: 1px solid #444;
    background-color: #444;
    color: white;
  }

  button.button {
    background-color: #444;
    color: white;
  }

  a {
    color: #888;
  }

  label {
    color: white;
  }
}


</style>
