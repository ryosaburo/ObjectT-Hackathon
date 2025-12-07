<template>
  <div class="title-screen">
    <h1>ObjectT Battle</h1>
    <p>韻を刻め。相手を倒せ。</p>
    <div class="actions">
      <button @click="$emit('start')">はじめる</button>
    </div>
  </div>
</template>

<script setup>
// シンプルなタイトル画面コンポーネント
</script>

<style scoped>
.title-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; gap:12px; }
.title-screen h1 { font-size:2.2rem; margin:0; }
.title-screen p { color:#666; }
.actions button { padding:10px 18px; border-radius:8px; border:none; background:#5b8cff; color:white; font-weight:700; cursor:pointer; }
</style>
