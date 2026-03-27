<template>
  <div class="form-container">
    <div class="form-card">
      <h2>{{ editingEntry ? 'edit memory' : 'create new memory' }}</h2>
      
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="author">author</label>
          <input 
            id="author"
            type="text" 
            :value="author"
            disabled
            class="disabled-input"
          >
        </div>

        <div class="form-group">
          <label for="date">date & time</label>
          <input 
            v-model="form.date"
            id="date"
            type="datetime-local"
            required
          >
        </div>

        <div class="form-group">
          <label for="title">name</label>
          <input 
            v-model="form.title" 
            id="title"
            type="text" 
            placeholder=""
            required
          >
        </div>

        <div class="form-group">
          <label for="photo">📸 pics (up to 10)</label>
          <div class="photo-input-wrapper">
            <input 
              id="photo"
              type="file"
              accept="image/*"
              multiple
              @change="handlePhotoUpload"
              class="photo-input"
            >
            <label for="photo" class="photo-label">
              <span v-if="form.photos.length === 0">Choose Photos</span>
              <span v-else>✓ {{ form.photos.length }} Photo<span v-if="form.photos.length > 1">s</span> Added</span>
            </label>
          </div>
          <p v-if="photoError" class="error-message">{{ photoError }}</p>
          <div v-if="form.photos.length > 0" class="photos-grid">
            <div v-for="(photo, idx) in form.photos" :key="idx" class="photo-preview">
              <img :src="photo" :alt="`Photo ${idx + 1}`" class="preview-img">
              <button type="button" @click="removePhoto(idx)" class="remove-photo-btn">✕</button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="mood">how did it make you feel?</label>
          <div class="mood-selector">
            <button 
              v-for="emoji in moods" 
              :key="emoji"
              type="button"
              :class="['mood-btn', { selected: form.mood === emoji }]"
              @click="form.mood = emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="content">the story</label>
          <textarea 
            v-model="form.content"
            id="content"
            rows="10"
            placeholder="write a lil summary"
            required
          ></textarea>
        </div>

        <div class="button-group">
          <button type="submit" class="submit-btn">
            {{ editingEntry ? 'Update Memory' : 'save' }}
          </button>
          <button v-if="editingEntry" type="button" class="cancel-btn" @click="cancelEdit">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewEntryForm',
  props: {
    author: {
      type: String,
      required: true
    },
    editingEntry: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'update', 'cancel'],
  data() {
    return {
      form: {
        title: '',
        content: '',
        mood: '❤️',
        photos: [],
        date: this.getCurrentDateTime()
      },
      moods: ['❤️', '😊', '😍', '🥰', '😌', '🎉', '✨', '🌙'],
      photoError: null,
      maxFileSize: 2 * 1024 * 1024 // 2MB
    }
  },
  watch: {
    editingEntry: {
      handler(newVal) {
        if (newVal) {
          // Update form fields individually to ensure proper Vue binding
          this.form.title = newVal.title || ''
          this.form.content = newVal.content || ''
          this.form.mood = newVal.mood || '❤️'
          this.form.photos = newVal.photos && newVal.photos.length > 0 ? [...newVal.photos] : []
          this.form.date = this.formatDateToInput(newVal.date)
        } else {
          // Clear form when not editing
          this.resetForm()
        }
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    // Ensure form is populated if editingEntry is set when component mounts
    if (this.editingEntry) {
      this.form.title = this.editingEntry.title || ''
      this.form.content = this.editingEntry.content || ''
      this.form.mood = this.editingEntry.mood || '❤️'
      this.form.photos = this.editingEntry.photos && this.editingEntry.photos.length > 0 ? [...this.editingEntry.photos] : []
      this.form.date = this.formatDateToInput(this.editingEntry.date)
    }
    // Ensure we have a valid date if not editing
    if (!this.form.date) {
      this.form.date = this.getCurrentDateTime()
    }
  },
  methods: {
    getCurrentDateTime() {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      return now.toISOString().slice(0, 16)
    },
    formatDateToInput(dateStr) {
      const date = new Date(dateStr)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      return date.toISOString().slice(0, 16)
    },
    handlePhotoUpload(event) {
      const files = event.target.files
      this.photoError = null
      
      if (!files || files.length === 0) return
      
      // Check total number of photos
      if (this.form.photos.length + files.length > 10) {
        this.photoError = `You can only upload up to 10 photos total. You already have ${this.form.photos.length}.`
        event.target.value = ''
        return
      }
      
      let processedCount = 0
      
      Array.from(files).forEach((file) => {
        // Check file size
        if (file.size > this.maxFileSize) {
          this.photoError = `File "${file.name}" is too large! Max size is 2MB.`
          return
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          this.photoError = `File "${file.name}" is not an image.`
          return
        }
        
        const reader = new FileReader()
        
        reader.onerror = () => {
          this.photoError = `Failed to read file "${file.name}"`
        }
        
        reader.onload = (e) => {
          try {
            const img = new Image()
            img.onload = () => {
              // Use setTimeout to prevent UI freeze during compression
              setTimeout(() => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height
                
                // Resize if image is too large (reduced from 1200 to 800 for faster processing)
                const maxWidth = 800
                const maxHeight = 800
                
                if (width > height) {
                  if (width > maxWidth) {
                    height *= maxWidth / width
                    width = maxWidth
                  }
                } else {
                  if (height > maxHeight) {
                    width *= maxHeight / height
                    height = maxHeight
                  }
                }
                
                canvas.width = width
                canvas.height = height
                
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)
                
                // Compress to JPEG (quality 0.6 for smaller files)
                const compressedPhoto = canvas.toDataURL('image/jpeg', 0.6)
                this.form.photos.push(compressedPhoto)
                
                processedCount++
                if (processedCount === Array.from(files).length) {
                  this.photoError = null
                  event.target.value = ''
                }
              }, 0)
            }
            
            img.onerror = () => {
              this.photoError = `Failed to load image "${file.name}"`
            }
            
            img.src = e.target.result
          } catch (error) {
            this.photoError = 'Error processing image'
          }
        }
        
        reader.readAsDataURL(file)
      })
    },
    removePhoto(index) {
      this.form.photos.splice(index, 1)
    },
    submitForm() {
      if (this.form.title && this.form.content) {
        const entryData = {
          author: this.author,
          title: this.form.title,
          content: this.form.content,
          mood: this.form.mood,
          photos: this.form.photos,
          date: new Date(this.form.date).toISOString()
        }
        
        if (this.editingEntry) {
          this.$emit('update', {
            ...entryData,
            id: this.editingEntry.id
          })
        } else {
          this.$emit('submit', entryData)
        }
        this.resetForm()
      }
    },
    cancelEdit() {
      this.resetForm()
      this.$emit('cancel')
    },
    resetForm() {
      this.form = {
        title: '',
        content: '',
        mood: '❤️',
        photos: [],
        date: this.getCurrentDateTime()
      }
    }
  }
}
</script>

<style scoped>
.form-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.form-card {
  background: var(--surface);
  border-radius: 15px;
  padding: 2.5rem;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 600px;
}

.form-card h2 {
  margin-bottom: 2rem;
  color: var(--accent);
  font-size: 1.8rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text);
}

input[type="text"],
input[type="datetime-local"],
textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid var(--input-border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--input-color);
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

input[type="text"]:focus,
input[type="datetime-local"]:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.disabled-input {
  background: var(--surface-2);
  color: var(--accent);
  font-weight: 600;
  cursor: not-allowed;
}

.disabled-input:focus {
  border-color: #e0e0e0;
  box-shadow: none;
}

textarea {
  resize: vertical;
  min-height: 150px;
}

.photo-input-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.photo-input {
  display: none;
}

.photo-label {
  display: block;
  padding: 0.8rem;
  background: var(--surface-2);
  border: 2px dashed var(--accent);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  color: var(--accent);
}

.photo-label:hover {
  background: var(--surface);
  border-color: var(--accent);
}

.error-message {
  color: var(--danger);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: rgba(236, 108, 108, 0.15);
  border-radius: 5px;
  border-left: 3px solid var(--danger);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.photo-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.remove-photo-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: white;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-photo-btn:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.mood-selector {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.mood-btn {
  background: var(--surface-2);
  border: 2px solid transparent;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-btn:hover {
  background: var(--surface);
  transform: scale(1.1);
}

.mood-btn.selected {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: 0 4px 12px var(--accent-soft);
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-btn {
  flex: 1;
  padding: 1rem;
  background: linear-gradient(135deg, var(--accent) 0%, #8f6bff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.cancel-btn {
  flex: 1;
  padding: 1rem;
  background: var(--surface-2);
  color: var(--text-muted);
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

.cancel-btn:active {
  transform: translateY(0);
}

@media (max-width: 600px) {
  .form-card {
    padding: 1.5rem;
  }
  
  .mood-btn {
    width: 45px;
    height: 45px;
    font-size: 1.2rem;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
