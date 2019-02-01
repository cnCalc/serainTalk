<template lang="pug">
  div.discuz-redirect-view
    h2 跳转中
    span 正在前往新版论坛，请稍后……
</template>

<script>
import api from '../api';

export default {
  name: 'discuz-redirect-view',
  title () {
    return '跳转中';
  },
  mounted () {
    if (this.$route.query.tid !== undefined) {
      api.v1.discuzLookup.discuzLookup({ tid: this.$route.query.tid }).then(res => {
        this.$router.replace(`/d/${res.discussionId}`);
      });
    }

    if (this.$route.params.tid !== undefined) {
      api.v1.discuzLookup.discuzLookup({ tid: this.$route.params.tid }).then(res => {
        this.$router.replace(`/d/${res.discussionId}`);
      });
    }

    if (this.$route.query.uid !== undefined) {
      api.v1.discuzLookup.discuzLookup({ uid: this.$route.query.uid }).then(res => {
        this.$router.replace(`/m/${res.memberId}`);
      });
    }
  },
  asyncData () {
    // return Promsie.resolved();
  },
};
</script>

<style lang="scss">
div.discuz-redirect-view {
  padding: 80px;
  text-align: left;
  h2 {
    font-weight: normal;
    padding: 20px;
  }
  span {
    padding-left: 20px;
  }
}

.dark-theme {
  h1, h2 {
    color: white;
  }
}
</style>
