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
  background-color: mix($theme_color, white, 20%);
  padding: 2px;
  box-sizing: border-box;
  transition: background-color ease 0.3s;
  vertical-align: middle;
  margin: 2px;

  div.circle {
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background-color: white;
    box-shadow: 0 2px 4px grey;
    transition: transform ease 0.3s;
  }

  &.checked {
    background-color: mix($theme_color, white, 60%);
    div.circle {
      transform: translateX(16px)
    }
  }
}


</style>
