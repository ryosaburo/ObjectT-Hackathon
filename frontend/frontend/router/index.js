import { createRouter, createWebHistory } from 'vue-router';
import TitleScreen from '../components/TitleScreen.vue';
import OpponentSelect from '../components/OpponentSelect.vue';
import BattleBoard from '../components/BattleBoard.vue';

const routes = [
  { path: '/', name: 'Home', component: TitleScreen },
  { path: '/select', name: 'Select', component: OpponentSelect },
  { path: '/battle', name: 'Battle', component: BattleBoard }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
