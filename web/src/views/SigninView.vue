<template lang="pug">
  div.signin-view
    div.signin-box: form(v-on:submit.prevent="doSignin")
      h2 登录 
      label.block(for="name") 用户名或电子邮件地址
      input(id="name", type="text", v-model="credentials.name", :readonly="busy" autocomplete="username")
      label.block(for="passwd") 密码
      input(id="passwd", type="password", v-model="credentials.password", :readonly="busy" autocomplete="current-password")
      div.remember-wrapper
        input(type="checkbox", id="remember", v-model="rememberMe", :readonly="busy")
        label(for="remember") 记住登录
      button.button(@click="doSignin", :disabled="busy") 登录
      div.quick-action-wrapper
        router-link(to="/signup") 前往注册
        router-link(:to="`/migration?next=${encodeURIComponent($route.query.next || path)}`") 账户迁移
        router-link(to="/reset-password") 忘记密码
</template>

<script>
import api from '../api';
import titleMixin from '../mixins/title';
// import bus from '../utils/ws-eventbus';

export default {
  name: 'SinginView',
  mixins: [titleMixin],
  data () {
    return {
      credentials: {
        name: '',
        password: '',
      },
      rememberMe: false,
    };
  },
  title: '登录',
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
  },
  methods: {
    doSignin () {
      if (this.busy) {
        return;
      }
      this.$store.commit('setBusy', true);
      api.v1.member.signin(this.credentials).then(response => {
        this.$store.commit('setBusy', false);
        this.$store.dispatch('fetchNotifications');
        this.$store.dispatch('fetchCurrentSigninedMemberInfo')
          .then(() => { this.$store.dispatch('fetchNotifications'); })
          .catch(e => {});
        this.$route.query.next && this.$router.push(decodeURIComponent(this.$route.query.next));
        this.bus.$emit('reconnect');
      }).catch(err => {
        this.$store.commit('setBusy', false);

        console.error(err);

        const res = err.response;
        const data = res.data;
        let message = '未知错误！查看 JavaScript 控制台确认问题！';

        if (data.code === 'ERR_MEMBER_NOT_FOUND') {
          message = '用户名不存在或密码错误。';
        } else if (data.code === 'ERR_REQUIRE_RESET_PASSWORD') {
          message = '该账户需要迁移后才可以使用，请前往账户迁移执行相关操作。';
        } else if (data.code === 'ERR_WRONG_PASSWORD') {
          message = '用户名不存在或密码错误。';
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

div.signin-view {
  font-size: 13px;

  div.signin-box {
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
    // outline: none;;
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

.dark-theme div.signin-view {
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
