/*eslint no-return-assign: 0*/

import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {},
    selectedTags: [],
    categoriesGroup: [],
  },
  mutations: {
    setTags: (state, newTagList) => state.selectedTags = newTagList,
    setCategoriesGroup: (state, newCategoriesGroup) => state.categoriesGroup = newCategoriesGroup,
  },
});
