<template lang="pug">
  .mingration-view: .mingration-box
    h2 账户迁移
    .verify-step(v-if="step === 'verify'")
      .explain 这里是一段解释说明文本
      form.stage-1(v-on:submit.prevent="doVerifyRequest")
        label.block(for="origUserName") 原 cnCalc 用户名：
        input(type="text" id="origUserName" v-model="origUserName")
        label.block(for="origPasswd") 原 cnCalc 密码：
        input(type="password" id="origPasswd" v-model="origPasswd")
        label.block(for="email") 新的邮箱地址：
        input(type="text" id="email" v-model="email")
        button.button(:disabled="busy") 下一步
    .perform-step(v-else)
      .explain 验证码已发送，请前往邮箱查看。
      form.stage-2(v-on:submit.prevent="doPerformMigration")
        label.block(for="token") 验证码：
        input(type="text" id="token" v-model="token")
        label.block(for="name") 新用户名（不可再修改）：
        input(type="text" id="name" v-model="name")
        label.block(for="passwd") 密码：
        input(type="password" id="passwd" v-model="passwd")
        label.block(for="repeatPasswd") 确认密码：
        input(type="password" id="repeatPasswd" v-model="repeatPasswd")
        button.button(:disabled="busy") 完成迁移
</template>

<script>
import api from '../api';

export default {
  name: 'migration-view',
  data () {
    return {
      origUserName: '',
      origPasswd: '',
      email: '',
      token: '',
      name: '',
      passwd: '',
      repeatPasswd: '',
      step: 'verify',
    };
  },
  computed: {
    busy () {
      return this.$store.state.busy;
    },
  },
  methods: {
    doVerifyRequest () {
      if (this.busy) {
        return;
      }
      const payload = {
        name: this.origUserName,
        password: this.origPasswd,
        email: this.email,
      };
      this.$store.commit('setBusy', true);
      api.v1.migration.requestMigration(payload).then(response => {
        this.$store.commit('setBusy', false);
        this.step = 'perform';
      }).catch(e => {
        this.$store.commit('setBusy', false);
        console.error(e);
        switch (e.response.status) {
          case 404:
            window.alert('用户不存在的。');
            break;
          case 400:
            window.alert('密码好像不对啊。');
            break;
        }
      });
    },
    doPerformMigration () {
      if (this.passwd !== this.repeatPasswd) {
        window.alert('两次密码不一致！');
        return;
      }
      if (this.busy) {
        return;
      }
      const payload = {
        token: this.token,
        name: this.name,
        password: this.passwd,
      };
      this.$store.commit('setBusy', true);
      api.v1.migration.performMigration(payload).then(response => {
        this.$store.commit('setBusy', false);
        if (response.status === 'ok') {
          window.alert('迁移成功');
          this.$route.query.next && this.$router.push(decodeURIComponent(this.$route.query.next));
        }
      }).catch(e => {
        this.$store.commit('setBusy', false);
        console.error(e);
        window.alert('出现问题，请联系管理员');
      });
    },
  },
};
</script>


<style lang="scss">
@import '../styles/global.scss';

div.mingration-view {
  font-size: 13px;

  div.mingration-box {
    text-align: left;
    display: inline-block;
    margin: 100px auto 0 auto;
  }

  h2 {
    font-size: 2em;
    font-weight: normal;
    text-align: left;
    margin-bottom: 0.25em;
  }

  .explain {
    margin-top: 1em;
    margin-bottom: 1em;
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

  label {
    margin-top: 20px;
  }

  label.block {
    display: block;
  }

  button.button {
    margin: 20px 0;
    width: 100%;
    border: none;
    display: block;
    background-color: $theme-color;
    color: white;
  }
}

.light-theme div.mingration-view {
  input[type="text"], input[type="password"] {
    border: 1px solid #ccc;
  }
  button.button {
    background-color: $theme-color;
    color: white;
  }
}

.dark-theme div.mingration-view {
  color: white;
  input[type="text"], input[type="password"] {
    border: 1px solid #444;
    background-color: #444;
    color: white;
  }
  button.button {
    background-color: #444;
    color: white;
  }
}
</style>
