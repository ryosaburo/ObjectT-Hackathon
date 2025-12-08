<template>
  <div class="battle-board">
    <div class="sidebar">
      <h3>単語ライブラリ</h3>
      <input v-model="q" placeholder="検索" @keyup.enter="fetchWords" />
      <button @click="fetchWords">検索</button>
      <div class="word-list">
        <WordCard v-for="w in words" :key="w.id" :word="w"
                  :selected="selectedIds.has(w.id)"
                  @select="toggleSelect" />
      </div>
      <button @click="suggestFromInput">ライム候補</button>
      <input v-model="suggestText" placeholder="ライム元のテキスト" />
    </div>

    <div class="composer">
      <div class="opponent-info" v-if="props.opponent">
        <h4>対戦相手: {{ props.opponent.name }}</h4>
        <p class="opp-desc">{{ props.opponent.desc }}</p>
      </div>
      <h3>作成エリア</h3>
      <div class="drop-area" @dragover.prevent @drop="onDropAtEnd">
        <template v-if="sequence.length === 0">
          <div class="placeholder">カードをドラッグして並べよう</div>
        </template>
        <div class="sequence">
          <div v-for="(w, idx) in sequence" :key="w.id" class="slot"
               @dragover.prevent @drop="onDropAtIdx($event, idx)">
            <WordCard :word="w" :selected="true" @select="removeFromSequence" />
            <div class="controls">
              <button @click="moveUp(idx)" :disabled="idx===0">↑</button>
              <button @click="moveDown(idx)" :disabled="idx===sequence.length-1">↓</button>
              <button @click="removeAt(idx)">×</button>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="exportLines">行としてコピー</button>
        <button @click="clearSequence">クリア</button>
      </div>

      <textarea readonly rows="6" v-model="exportText"></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
const props = defineProps({ opponent: { type: Object, default: null } });
import WordCard from './WordCard.vue';

const words = ref([]);
const q = ref('');
const suggestText = ref('');
const selectedIds = reactive(new Set());
const sequence = ref([]);
const exportText = ref('');

async function fetchWords() {
  const params = new URLSearchParams();
  if (q.value) params.set('q', q.value);
  const res = await fetch('/api/words?' + params.toString());
  const json = await res.json();
  if (json.ok) words.value = json.data;
}

function toggleSelect(word) {
  if (selectedIds.has(word.id)) selectedIds.delete(word.id);
  else selectedIds.add(word.id);
  // 選択は即追加する振る舞いにする（好みで変更）
  if (!sequence.value.find(w => w.id === word.id)) sequence.value.push(word);
}

function removeFromSequence(word) {
  const idx = sequence.value.findIndex(w => w.id === word.id);
  if (idx >= 0) sequence.value.splice(idx, 1);
  selectedIds.delete(word.id);
}

function onDropAtEnd(e) {
  const data = e.dataTransfer.getData('application/json');
  if (!data) return;
  const w = JSON.parse(data);
  if (!sequence.value.find(x => x.id === w.id)) {
    sequence.value.push(w);
    selectedIds.add(w.id);
  }
}

function onDropAtIdx(e, idx) {
  const data = e.dataTransfer.getData('application/json');
  if (!data) return;
  const w = JSON.parse(data);
  // remove existing pos if present
  sequence.value = sequence.value.filter(x => x.id !== w.id);
  sequence.value.splice(idx, 0, w);
  selectedIds.add(w.id);
}

function moveUp(i) { if (i>0) { const a=sequence.value; [a[i-1],a[i]]=[a[i],a[i-1]]; } }
function moveDown(i) { const a=sequence.value; if (i<a.length-1) [a[i+1],a[i]]=[a[i],a[i+1]]; }
function removeAt(i) { selectedIds.delete(sequence.value[i].id); sequence.value.splice(i,1); }
function clearSequence() { sequence.value = []; selectedIds.clear(); exportText.value=''; }
function exportLines() { exportText.value = sequence.value.map(s => s.text).join('\\n'); }

async function suggestFromInput() {
  if (!suggestText.value) return;
  const res = await fetch('/api/words/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: suggestText.value, limit: 30 })
  });
  const json = await res.json();
  if (json.ok) words.value = json.data;
}

onMounted(() => { fetchWords(); });
</script>

<style scoped>
.battle-board { display:flex; gap:16px; padding:12px; font-family:system-ui; }
.sidebar { width:340px; border:1px solid #e6e6e6; padding:12px; border-radius:8px; background:#fafafa; }
.word-list { display:flex; flex-wrap:wrap; gap:8px; max-height:60vh; overflow:auto; padding-top:8px; }
.composer { flex:1; border:1px solid #e6e6e6; padding:12px; border-radius:8px; background:#fff; }
.drop-area { min-height:240px; border:2px dashed #ddd; padding:8px; border-radius:8px; }
.slot { display:flex; gap:8px; align-items:center; margin-bottom:8px; background:#f7f8fb; padding:8px; border-radius:6px; }
.controls button { margin-left:6px; }
.placeholder { color:#999; padding:24px; text-align:center; }
.sequence { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
textarea { width:100%; margin-top:8px; }
.opponent-info { border:1px solid #eee; padding:10px; border-radius:8px; margin-bottom:8px; background:#fafafd; }
.opp-desc { color:#666; font-size:13px; margin:0; }
</style>