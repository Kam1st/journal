<template>
  <div class="form-container">
    <div class="form-card">
      <h2>{{ editingEntry ? 'Edit Memory' : 'Create a New Memory' }}</h2>
      
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="author">Author</label>
          <input 
            id="author"
            type="text" 
            :value="author"
            disabled
            class="disabled-input"
          >
        </div>

        <div class="form-group">
          <label for="date">Date & Time</label>
          <input 
            v-model="form.date"
            id="date"
            type="datetime-local"
            required
          >
        </div>

        <div class="form-group">
          <label for="title">Title</label>
          <input 
            v-model="form.title" 
            id="title"
            type="text" 
            placeholder="Give this moment a title..."
            required
          >
        </div>

        <div class="form-group">
          <label for="photo">📸 Add Photos (up to 10)</label>
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
          <label for="mood">How are you feeling?</label>
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
          <label for="content">Your Story</label>
          <textarea 
            v-model="form.content"
            id="content"
            rows="10"
            placeholder="Write about this special moment together..."
            required
          ></textarea>
        </div>

        <div class="button-group">
          <button type="submit" class="submit-btn">
            {{ editingEntry ? 'Update Memory' : 'Save Memory' }}
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
              const canvas = document.createElement('canvas')
              let width = img.width
              let height = img.height
              
              // Resize if image is too large
              const maxWidth = 1200
              const maxHeight = 1200
              
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
              
              // Compress to JPEG
              const compressedPhoto = canvas.toDataURL('image/jpeg', 0.8)
              this.form.photos.push(compressedPhoto)
              
              processedCount++
              if (processedCount === Array.from(files).length) {
                this.photoError = null
                event.target.value = ''
              }
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
  background: white;
  border-radius: 15px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
}

.form-card h2 {
  margin-bottom: 2rem;
  color: #667eea;
  font-size: 1.8rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

input[type="text"],
input[type="datetime-local"],
textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input[type="text"]:focus,
input[type="datetime-local"]:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.disabled-input {
  background: #f5f5f5;
  color: #667eea;
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
  background: #f5f5f5;
  border: 2px dashed #667eea;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  color: #667eea;
}

.photo-label:hover {
  background: #eeeeee;
  border-color: #764ba2;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #fadbd8;
  border-radius: 5px;
  border-left: 3px solid #e74c3c;
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
  background: #f5f5f5;
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
  background: #e8e8e8;
  transform: scale(1.1);
}

.mood-btn.selected {
  border-color: #667eea;
  background: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-btn {
  flex: 1;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: white;
  color: #666;
  border: 2px solid #ddd;
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
