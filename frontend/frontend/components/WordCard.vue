<template>
  <div class="word-card" :class="{ selected }" draggable="true"
       @dragstart="onDragStart" @dragend="onDragEnd" @click="onClick">
    <div class="text">{{ word.text }}</div>
    <div class="meta">
      <small v-if="word.reading">{{ word.reading }}</small>
      <span class="tags" v-if="word.tags?.length">[{{ word.tags.join(',') }}]</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  word: { type: Object, required: true },
  selected: { type: Boolean, default: false }
});
const emit = defineEmits(['select', 'dragstart', 'dragend']);

function onClick() {
  emit('select', props.word);
}
function onDragStart(e) {
  e.dataTransfer.setData('application/json', JSON.stringify(props.word));
  emit('dragstart', props.word);
}
function onDragEnd() {
  emit('dragend');
}
</script>

<style scoped>
.word-card {
  width: 160px;
  padding: 10px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  border: 1px solid #e6e6e6;
  cursor: grab;
  user-select: none;
}
.word-card.selected { border-color: #5b8cff; box-shadow: 0 4px 16px rgba(91,140,255,0.12); }
.word-card .text { font-weight: 700; margin-bottom: 6px; }
.word-card .meta { color:#666; font-size:12px; display:flex; gap:6px; align-items:center; }
.tags { color:#999; }
</style>