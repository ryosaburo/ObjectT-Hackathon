<template>
  <div
    class="word-card"
    :class="{ selected, disabled: word.disabled }"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="onClick"
    @keydown="onKeyDown"
  >
    <div class="text">{{ word.text }}</div>
    <div class="meta">
      <small v-if="word.reading" class="reading">{{ word.reading }}</small>
      <span class="tags" v-if="word.tags?.length">[{{ word.tags.join(',') }}]</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  word: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});
const emit = defineEmits(['select', 'dragstart', 'dragend']);

function onClick() {
  if (props.word?.disabled) return;
  emit('select', props.word);
}
function onDragStart(e) {
  if (props.word?.disabled) return;
  e.dataTransfer.setData('application/json', JSON.stringify(props.word));
  emit('dragstart', props.word);
}
function onDragEnd() {
  emit('dragend');
}
function onKeyDown(e) {
  // Enter または Space でクリックと同じ挙動にする
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    onClick();
  }
}
</script>

<style scoped>
.word-card {
  width: 160px;
  padding: 14px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), var(--glass));
  box-shadow: 0 8px 28px rgba(2,6,23,0.45);
  border: 1px solid rgba(255,255,255,0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 96px;
  transition: transform .18s ease, box-shadow .18s ease, opacity .12s ease;
  cursor: grab;
  user-select: none;
  outline: none;
}
.word-card:active { cursor: grabbing }

/* hover / focus-visible を明確に提供 */
.word-card:hover,
.word-card:focus-visible {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(2,6,23,0.6);
}

.word-card.selected {
  border-color: rgba(91,140,255,0.9);
  box-shadow: 0 8px 30px rgba(91,140,255,0.12);
  transform: scale(1.02);
}
.word-card.disabled { opacity: 0.45; pointer-events: none }

.text {
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 18px;
  color: #fff;
  line-height: 1.15;
  word-break: break-word;
}

.reading {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.meta {
  margin-top: auto;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
}

.tags { color: rgba(255,255,255,0.65) }

/* 小さいバッジやアクション向け */
.badge {
  background: rgba(255,255,255,0.04);
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--muted);
}

@media (max-width: 520px) {
  .word-card { padding: 12px; min-height: 84px }
  .text { font-size: 16px }
}
</style>