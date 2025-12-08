<template>
  <div class="opponent-select">
    <h2>対戦相手を選ぶ</h2>
    <input v-model="q" placeholder="検索（タグや名前）" @keyup.enter="fetchOpponents" />
    <div class="list">
      <div v-for="opp in opponents" :key="opp.id" class="opp-card" @click="select(opp)">
        <div class="name">{{ opp.name }}</div>
        <div class="meta">{{ opp.desc }}</div>
      </div>
    </div>
    <div class="actions">
      <button @click="back">戻る</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const emit = defineEmits(['select', 'back']);
const q = ref('');
const opponents = ref([]);

async function fetchOpponents() {
  // 仮: ダミーデータ。将来 API から取得
  opponents.value = [
    { id: 1, name: 'MC Blaze', desc: '速いフローを持つ' },
    { id: 2, name: 'Lady Rhyme', desc: '巧みなライムの使い手' },
    { id: 3, name: 'Old School', desc: 'ベテランの安定感' }
  ].filter(o => !q.value || o.name.toLowerCase().includes(q.value.toLowerCase()));
}

function select(opp) {
  emit('select', opp);
}
function back() {
  emit('back');
}

onMounted(() => fetchOpponents());
</script>

<style scoped>
.opponent-select { padding:12px; }
.opp-card { padding:10px; border:1px solid #eee; border-radius:8px; margin-bottom:8px; cursor:pointer; }
.actions { margin-top:12px; }
</style>
