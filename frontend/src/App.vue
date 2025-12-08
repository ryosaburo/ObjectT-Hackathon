<template>
  <div id="app">
    <!-- view によって画面を切り替える: title -> opponent select -> battle -->
    <TitleScreen v-if="view === 'title'" @start="onStart" />
    <OpponentSelect v-else-if="view === 'select'" @select="onSelectOpponent" @back="view = 'title'" />
    <BattleBoard v-else-if="view === 'battle'" :opponent="selectedOpponent" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TitleScreen from './components/TitleScreen.vue';
import OpponentSelect from './components/OpponentSelect.vue';
import BattleBoard from './components/BattleBoard.vue';

const view = ref('title');
const selectedOpponent = ref(null);

function onStart() {
  view.value = 'select';
}
function onSelectOpponent(opp) {
  selectedOpponent.value = opp;
  view.value = 'battle';
}
</script>

<style>
/* ...existing code... */
#app { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 12px; }
</style>