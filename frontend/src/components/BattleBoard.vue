<template>
  <div class="battle-board">
    <div class="composer">
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
        <button @click="generateRap">ラップを作成</button>
      </div>

      <textarea readonly rows="6" v-model="exportText"></textarea>
    </div>

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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
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
function exportLines() { exportText.value = sequence.value.map(s => s.text).join('\n'); }

// sequence に並んだ単語から簡易ラップ（複数行）を生成して exportText に出力する
function generateRap() {
  if (!sequence.value || sequence.value.length === 0) {
    exportText.value = '';
    return;
  }
  const wordsArr = sequence.value.map(s => s.text);
  const suffixes = ['よ', 'ぜ', 'さ', 'ね']; // 行末のノリ
  const lines = [];
  const wordsPerLine = 3; // 1行に使う単語数（簡易）
  for (let i = 0; i < wordsArr.length; i += wordsPerLine) {
    const chunk = wordsArr.slice(i, i + wordsPerLine);
    // カンマっぽく「、」でつなぎ、最後は勢いのある句点を付ける
    const line = chunk.join('、') + (Math.random() > 0.4 ? '！' : '。') + ' ' + suffixes[(i / wordsPerLine) % suffixes.length];
    lines.push(line);
  }
  // 先頭に短い導入も付ける
  const intro = 'Yo, 聞いてくれ、';
  exportText.value = [intro, ...lines].join('\n');
}

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
.battle-board { display:flex; gap:16px; padding:12px; font-family:system-ui; /* change layout to vertical on small screens and default */ flex-direction: column; }
.sidebar { width:100%; border:1px solid #e6e6e6; padding:12px; border-radius:8px; background:#fafafa; order: 2; /* move to bottom */ height: 220px; overflow: hidden; }
.word-list { display:flex; flex-wrap:nowrap; gap:8px; max-height:100%; overflow-x:auto; padding-top:8px; align-items:center; }
.composer { flex:1; border:1px solid #e6e6e6; padding:12px; border-radius:8px; background:#fff; order: 1; width:100%; }
/* ensure slots still stack vertically in composer */
.sequence { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
textarea { width:100%; margin-top:8px; }
.drop-area { min-height:240px; border:2px dashed #ddd; padding:8px; border-radius:8px; }
.slot { display:flex; gap:8px; align-items:center; margin-bottom:8px; background:#f7f8fb; padding:8px; border-radius:6px; }
.controls button { margin-left:6px; }
.placeholder { color:#999; padding:24px; text-align:center; }
</style>