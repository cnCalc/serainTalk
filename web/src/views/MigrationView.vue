<template lang="pug">
  .mingration-view: .mingration-box
    h2 账户迁移
    div(v-if="step === 'getMemberName'")
      .explain 
        div 这里是一段解释说明文本。
        div 迁移的过程中请不要关闭浏览器。
      form(v-on:submit.prevent="doCheckName")
        label.block(for="origUserName") 原 cnCalc 用户名：
        input(type="text" id="origUserName" v-model="origUserName")
        button.button(:disabled="busy") 下一步
    div(v-if="step === 'checkOrigEmail'")
      .explain 
        div 在我们的记录中，您的电子邮件地址是：
        div {{ origEmail }}
        div 请根据他是否仍然可以使用来选择下一步操作
      form
        button.button(type="button" :disabled="busy" @click="doSendCode") 是，它仍然是我的邮箱
        button.button(type="button" :disabled="busy" @click="doUpdateEmail") 不，他已经遗失或无效
    div(v-if="step === 'updateEmail'")
      .explain 
        div 我们需要验证你的密码以确保万无一失
      form(v-on:submit.prevent="doSendCode")
        label.block(for="oldPassword") 旧密码：
        input(type="text" id="oldPassword" v-model="oldPassword")
        label.block(for="newEmail") 新的邮件地址：
        input(type="text" id="newEmail" v-model="newEmail")
        button.button(:disabled="busy") 下一步
    div(v-if="step === 'setUpNewInfo'")
      .explain 
        div 验证码已发送到您的邮箱，请注意查收。
      form(v-on:submit.prevent="doMingration")
        label.block(for="verificationCode") 验证码：
        input(type="text" id="verificationCode" v-model="verificationCode")
        label.block(for="newUserName") 新用户名（不可再变更）：
        input(type="text" id="newUserName" v-model="newUserName")
        label.block(for="newPassword") 新密码：
        input(type="password" id="newPassword" v-model="newPassword")
        label.block(for="repeatNewPassword") 重复密码：
        input(type="password" id="repeatNewPassword" v-model="repeatNewPassword")
        button.button(:disabled="busy") 下一步
</template>

<script>
import api from '../api';

export default {
  name: 'migration-view',
  data () {
    return {
      origUserName: '',
      origEmail: '',
      step: 'getMemberName',
      verificationCode: '',
      newUserName: '',
      newPassword: '',
      repeatNewPassword: '',
      newEmail: '',
      oldPassword: '',
    };
  },
  computed: {
    busy () {
      return this.$store.state.busy;
    },
  },
  methods: {
    doCheckName () {
      api.v1.member.fetchMemberInfoByName({ name: this.origUserName }).then(res => {
        if (res.list.length !== 1) {
          return window.alert('用户名不存在？');
        } else {
          this.origEmail = res.list[0].email;
          this.step = 'checkOrigEmail';
        }
      });
    },
    doSendCode () {
      let payload = {
        name: this.origUserName,
      };

      if (this.newEmail) {
        payload.email = this.newEmail;
        payload.password = this.oldPassword;
      }

      api.v1.migration.requestMigration(payload).then(() => {
        this.step = 'setUpNewInfo';
        this.newUserName = this.origUserName;
      });
    },
    doMingration () {
      if (this.newPassword !== this.repeatNewPassword) {
        return window.alert('两次密码不一致！');
      }
      if (this.verificationCode === '') {
        return window.alert('请输入验证码！');
      }
      api.v1.migration.performMigration({
        token: this.verificationCode,
        name: this.origUserName,
        newname: this.newUserName !== this.origUserName ? this.newUserName : undefined,
        password: this.newPassword,
      }).then(() => {
        window.alert('迁移成功！');
        this.$route.query.next && this.$router.push(decodeURIComponent(this.$route.query.next));
      });
    },
    doUpdateEmail () {
      this.step = 'updateEmail';
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

  .explain {
    width: 300px;
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
