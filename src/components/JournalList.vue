<template>
  <div class="timeline-container">
    <div v-if="entries.length === 0" class="empty-state">
      <p>📝 try it out! </p>
    </div>

    <div v-else class="timeline">
      <JournalEntry 
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
        @edit-entry="$emit('edit-entry', $event)"
        @delete-entry="$emit('delete-entry', $event)"
      />
    </div>
  </div>
</template>

<script>
import JournalEntry from './JournalEntry.vue'

export default {
  name: 'JournalList',
  components: {
    JournalEntry
  },
  emits: ['edit-entry', 'delete-entry'],
  props: {
    entries: {
      type: Array,
      required: true
    }
  }
}
</script>

<style scoped>
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.empty-state {
  background: var(--surface);
  border-radius: 15px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: var(--shadow);
  color: var(--text-muted);
  font-size: 1.2rem;
  margin: 2rem 0;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (max-width: 600px) {
  .timeline-container {
    gap: 1.5rem;
  }
}
</style>
