<template>
  <div class="entry-card">
    <div class="entry-header">
      <div class="entry-meta">
        <h3>{{ entry.title }}</h3>
        <p class="author">by {{ entry.author }}</p>
        <p class="date">{{ formatDate(entry.date) }}</p>
      </div>
      <div class="header-right">
        <div class="mood">{{ entry.mood }}</div>
        <div class="actions">
          <button class="action-btn edit-btn" @click="$emit('edit-entry', entry)" title="Edit">✏️</button>
          <button class="action-btn delete-btn" @click="deleteEntry" title="Delete">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="entry.photos && entry.photos.length > 0" class="entry-photos">
      <img 
        v-for="(photo, idx) in entry.photos" 
        :key="idx"
        :src="photo" 
        :alt="`Photo ${idx + 1}`" 
        class="photo-img"
      />
    </div>

    <div class="entry-content">
      <p>{{ entry.content }}</p>
    </div>

    <div class="entry-footer">
      <div class="last-updated" v-if="entry.lastUpdatedAt || entry.lastUpdatedBy">
        <small>
          last update: <strong>{{ entry.lastUpdatedAt ? formatDate(entry.lastUpdatedAt) : '—' }}</strong>
          <span v-if="entry.lastUpdatedBy"> by {{ entry.lastUpdatedBy }}</span>
        </small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JournalEntry',
  emits: ['edit-entry', 'delete-entry'],
  props: {
    entry: {
      type: Object,
      required: true,
      validator(obj) {
        return obj.id && obj.title && obj.content && obj.author && obj.date && obj.mood
      }
    }
  },
  methods: {
    formatDate(date) {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
      return new Date(date).toLocaleDateString('en-US', options)
    },
    calculateReadTime(content) {
      const wordsPerMinute = 200
      const words = content.trim().split(/\s+/).length
      const minutes = Math.ceil(words / wordsPerMinute)
      return Math.max(1, minutes)
    },
    deleteEntry() {
      if (confirm('heyyyyy are you sure you wanna delete? cannot undo it after boo.')) {
        this.$emit('delete-entry', this.entry.id)
      }
    }
  }
}
</script>

<style scoped>
.entry-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 5px solid #667eea;
  overflow: hidden;
}

.entry-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.entry-meta {
  flex: 1;
}

.entry-meta h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.author {
  margin: 0;
  color: #667eea;
  font-weight: 600;
  font-size: 0.95rem;
}

.date {
  margin: 0.3rem 0 0 0;
  color: #999;
  font-size: 0.85rem;
}

.header-right {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}

.mood {
  font-size: 2rem;
  min-width: 60px;
  text-align: center;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  transition: transform 0.2s ease;
  border-radius: 5px;
}

.action-btn:hover {
  transform: scale(1.2);
}

.edit-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.delete-btn:hover {
  background: rgba(231, 76, 60, 0.1);
}

.entry-photos {
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.photo-img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

.entry-content {
  margin-bottom: 1.5rem;
  line-height: 1.8;
  color: #555;
}

.entry-content p {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.entry-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.read-time {
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
}

@media (max-width: 600px) {
  .entry-card {
    padding: 1.5rem;
  }

  .entry-header {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .entry-meta h3 {
    font-size: 1.3rem;
  }

  .mood {
    font-size: 1.8rem;
    min-width: auto;
  }
}
</style>
