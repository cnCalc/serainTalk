<template lang="pug">
  div.check-box(v-bind:class="{ checked: checked }")
    div.circle
</template>


<script>
export default {
  name: 'check-box',
  props: ['checked']
}
</script>

<style lang="scss">
@import '../../styles/global.scss';

div.check-box {
  display: inline-block;
  clear: left;
  width: 40px;
  height: 24px;
  border-radius: 12px;
  padding: 2px;
  box-sizing: border-box;
  transition: background-color ease 0.3s;
  vertical-align: middle;
  margin: 2px;

  div.circle {
    width: 20px;
    height: 20px;
    border-radius: 10px;
    transition: transform ease 0.3s;
  }

  &.checked {
    div.circle {
      transform: translateX(16px)
    }
  }
}

.light-theme div.check-box {
  background-color: mix($theme_color, white, 20%);

  div.circle {
    background-color: white;
    box-shadow: 0 2px 4px grey;
  }

  &.checked {
    background-color: mix($theme_color, white, 60%);
  }
}

.dark-theme div.check-box {
  background-color: #383838;

  div.circle {
    background-color: white;
    box-shadow: 0 2px 4px grey;
  }

  &.checked {
    background-color: #686868;
  }
}

</style>
