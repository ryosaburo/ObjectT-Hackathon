<template>
  <div class="word-selector">
    <h3>単語選択</h3>

    <div class="controls">
      <input v-model="query" @keyup.enter="fetchWords" placeholder="検索ワードを入力" />
      <select v-model="tag">
        <option value="">タグで絞らない</option>
        <option v-for="t in knownTags" :key="t" :value="t">{{ t }}</option>
      </select>
      <button @click="fetchWords">検索</button>

      <div class="rhyme">
        <input v-model="rhymeInput" placeholder="ライム候補を出すためのテキスト" />
        <button @click="suggest">ライム候補を取得</button>
      </div>
    </div>

    <div class="panel">
      <div class="list">
        <h4>候補（{{ words.length }}）</h4>
        <ul>
          <li v-for="w in words" :key="w.id">
            <div class="word-line">
              <div class="meta">
                <strong>{{ w.text }}</strong>
                <small v-if="w.reading">（{{ w.reading }}）</small>
                <span class="tags" v-if="w.tags && w.tags.length">[{{ w.tags.join(',') }}]</span>
              </div>
              <div class="actions">
                <button @click="addWord(w)">追加</button>
                <button @click="showDetail(w.id)">詳細</button>
              </div>
            </div>
          </li>
        </ul>

        <div class="pagination">
          <button :disabled="offset===0" @click="changePage(-1)">前へ</button>
          <button @click="changePage(1)">次へ</button>
        </div>
      </div>

      <div class="composer">
        <h4>選択中の単語</h4>
        <ol>
          <li v-for="(s, idx) in selected" :key="s.id">
            {{ s.text }} <small v-if="s.reading">（{{ s.reading }}）</small>
            <button @click="removeSelected(idx)">削除</button>
            <button @click="moveUp(idx)" :disabled="idx===0">↑</button>
            <button @click="moveDown(idx)" :disabled="idx===selected.length-1">↓</button>
          </li>
        </ol>

        <div class="composer-actions">
          <button @click="exportJSON">JSON エクスポート</button>
          <button @click="exportLines">行としてコピー</button>
          <textarea readonly rows="6" v-model="exportText"></textarea>
        </div>
      </div>
    </div>

    <div v-if="detail" class="detail">
      <h4>単語詳細: {{ detail.text }}</h4>
      <p>読み: {{ detail.reading }}</p>
      <p>タグ: {{ detail.tags.join(', ') }}</p>
      <div>
        <h5>例文</h5>
        <ul>
          <li v-for="e in detail.examples" :key="e.id">{{ e.sentence }} <small>—{{ e.author || 'unknown' }}</small></li>
        </ul>
      </div>
      <button @click="detail = null">閉じる</button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const words = ref([]);
const knownTags = ref([]);
const query = ref('');
const tag = ref('');
const offset = ref(0);
const limit = 20;
const selected = ref([]);
const detail = ref(null);
const rhymeInput = ref('');
const exportText = ref('');

async function fetchWords() {
  try {
    const params = new URLSearchParams();
    if (query.value) params.set('q', query.value);
    if (tag.value) params.set('tag', tag.value);
    params.set('limit', String(limit));
    params.set('offset', String(offset.value));
    const res = await fetch('/api/words?' + params.toString());
    const json = await res.json();
    if (json.ok) {
      words.value = json.data;
      // collect known tags from results
      const tagsSet = new Set();
      json.data.forEach(w => (w.tags || []).forEach(t => tagsSet.add(t)));
      knownTags.value = Array.from(tagsSet);
    } else {
      console.error(json);
    }
  } catch (err) {
    console.error('fetchWords error', err);
  }
}

function changePage(delta) {
  offset.value = Math.max(0, offset.value + delta * limit);
  fetchWords();
}

function addWord(w) {
  // 同じ id の重複を防ぐ
  if (!selected.value.some(s => s.id === w.id)) selected.value.push(w);
}

function removeSelected(idx) {
  selected.value.splice(idx, 1);
}

function moveUp(idx) {
  if (idx <= 0) return;
  const a = selected.value;
  [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
}

function moveDown(idx) {
  const a = selected.value;
  if (idx >= a.length - 1) return;
  [a[idx + 1], a[idx]] = [a[idx], a[idx + 1]];
}

async function showDetail(id) {
  try {
    const res = await fetch(`/api/words/${id}`);
    const json = await res.json();
    if (json.ok) detail.value = json.data;
  } catch (err) {
    console.error('showDetail error', err);
  }
}

async function suggest() {
  try {
    const res = await fetch('/api/words/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rhymeInput.value, limit: 30 })
    });
    const json = await res.json();
    if (json.ok) {
      words.value = json.data;
    }
  } catch (err) {
    console.error('suggest error', err);
  }
}

function exportJSON() {
  exportText.value = JSON.stringify(selected.value, null, 2);
}

function exportLines() {
  exportText.value = selected.value.map(s => s.text).join('\\n');
}

onMounted(() => {
  fetchWords();
});
</script>

<style scoped>
.word-selector { max-width: 1000px; margin: 12px auto; font-family: system-ui; }
.controls { display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
.panel { display:flex; gap:16px; }
.list { flex:1; border:1px solid #ddd; padding:8px; border-radius:6px; }
.composer { width:320px; border:1px solid #ddd; padding:8px; border-radius:6px; }
.word-line { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f2f2f2; }
.word-line .meta { display:flex; gap:8px; align-items:center; }
.tags { color:#666; font-size:12px; margin-left:8px; }
.actions button { margin-left:6px; }
.detail { margin-top:16px; border-top:1px dashed #ccc; padding-top:12px; }
</style>