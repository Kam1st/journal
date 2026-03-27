<template>
  <div id="app" :class="{ 'dark-mode': darkMode }">
    <LoginPage v-if="!currentUser" @login="handleLogin" />
    
    <div v-else>
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="logo">💕 our new journal</h1>
          <div class="nav-links">
            <button class="theme-toggle" @click="darkMode = !darkMode" :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'">
              {{ darkMode ? '🌙' : '☀️' }}
            </button>
            <button 
              :class="['nav-btn', { active: currentView === 'timeline' }]"
              @click="currentView = 'timeline'"
            >
              timeline
            </button>
            <button 
              :class="['nav-btn', { active: currentView === 'new' }]"
              @click="currentView = 'new'"
            >
              new entry
            </button>
            <button class="nav-btn logout-btn" @click="handleLogout">
              logout
            </button>
          </div>
        </div>
      </nav>

      <div class="user-info">
        <span>👤 editing as: <strong>{{ currentUser }}</strong></span>
      </div>

      <div class="main-content">
        <NewEntryForm 
          v-if="currentView === 'new'"
          :author="currentUser"
          :editing-entry="editingEntry"
          @submit="addEntry"
          @update="updateEntry"
          @cancel="cancelEdit"
        />
        <JournalList 
          v-else
          :entries="entries"
          @edit-entry="editEntry"
          @delete-entry="deleteEntry"
        />
      </div>
    </div>
  </div>
</template>

<script>
import LoginPage from './components/Login.vue'
import NewEntryForm from './components/NewEntryForm.vue'
import JournalList from './components/JournalList.vue'
import { initFirebase, listenEntries, createOrUpdateEntry, removeEntryByClientId, signInAnonymous, onAuthChange } from './services/firebase'

export default {
  name: 'App',
  components: {
    LoginPage,
    NewEntryForm,
    JournalList
  },
  data() {
    return {
      currentView: 'timeline',
      currentUser: null,
      darkMode: false,
      editingEntry: null,
      firebaseUnsub: null,
      entries: [
        {
          id: 1,
          author: 'Kamilah',
          date: new Date('2025-02-15').toISOString(),
          title: 'Our First Entry',
          content: 'This is the first moment we\'re sharing together in this journal. Here\'s to many more memories.',
          mood: '❤️',
          photos: []
        }
      ]
    }
  },
  mounted() {
    // Check if user was previously logged in
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      this.currentUser = savedUser
    }

    // Load theme mode from localStorage
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      this.darkMode = savedMode === 'true'
    }
    document.body.classList.toggle('dark-mode', this.darkMode)

    // Load entries from localStorage
    const savedEntries = localStorage.getItem('journalEntries')
    if (savedEntries) {
      try {
        this.entries = JSON.parse(savedEntries)
      } catch (e) {
        console.error('Error loading entries:', e)
      }
    }

    // Initialize Firebase if configured
    console.log('App mounted - initializing Firebase...')
    const ok = initFirebase()
    if (ok) {
      try {
        console.log('Firebase initialized - signing in anonymously...')
        signInAnonymous().catch((err) => { console.warn('Anonymous sign-in failed:', err) })
        onAuthChange((user) => {
          console.log('Auth change detected, setting up listener...')
          if (user) {
            // start listening to collection
            this.firebaseUnsub = listenEntries((docs) => {
              console.log('Entries listener callback with', docs.length, 'docs')
              // simple merge: replace local list with remote docs mapped to local shape
              const mapped = docs.map(d => ({
                id: d.client_id != null ? d.client_id : Math.max(...this.entries.map(e => Number(e.id)), 0) + 1,
                author: d.author,
                date: d.date,
                title: d.title,
                content: d.content,
                mood: d.mood,
                photos: d.photos || [],
                lastUpdatedAt: d.lastUpdatedAt,
                lastUpdatedBy: d.lastUpdatedBy,
                remoteId: d.remoteId
              }))
              if (mapped.length > 0) {
                console.log('Updating entries with', mapped.length, 'items')
                this.entries = mapped
                this.saveEntries()
              }
            })
          }
        })
      } catch (e) {
        console.warn('Firebase listen failed:', e)
      }
    } else {
      console.log('Firebase not configured - using localStorage only')
    }
  },
  beforeUnmount() {
    if (this.firebaseUnsub) this.firebaseUnsub()
  },
  watch: {
    darkMode(newValue) {
      localStorage.setItem('darkMode', newValue)
      document.body.classList.toggle('dark-mode', newValue)
    }
  },
  methods: {
    handleLogin(username) {
      this.currentUser = username
      localStorage.setItem('currentUser', username)
      this.currentView = 'timeline'
    },
    handleLogout() {
      this.currentUser = null
      localStorage.removeItem('currentUser')
      this.currentView = 'timeline'
      this.editingEntry = null
    },
    async addEntry(entryData) {
      const newEntry = {
        id: Math.max(...this.entries.map(e => e.id), 0) + 1,
        author: entryData.author,
        date: entryData.date,
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        photos: entryData.photos || [],
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: this.currentUser || entryData.author
      }
      console.log('Adding entry:', newEntry)
      this.entries.unshift(newEntry)
      this.saveEntries()
      this.currentView = 'timeline'
      // push to Firebase if available
      try { await createOrUpdateEntry(newEntry) } catch (e) { console.error('Failed to push to Firebase:', e) }
    },
    editEntry(entry) {
      this.editingEntry = entry
      this.currentView = 'new'
    },
    async updateEntry(entryData) {
      const index = this.entries.findIndex(e => e.id === entryData.id)
      if (index !== -1) {
        const originalEntry = this.entries[index]
        // Merge: keep original values for any fields not explicitly changed
        this.entries[index] = {
          ...originalEntry,
          title: entryData.title || originalEntry.title,
          content: entryData.content || originalEntry.content,
          mood: entryData.mood || originalEntry.mood,
          photos: entryData.photos && entryData.photos.length > 0 ? entryData.photos : originalEntry.photos,
          date: entryData.date || originalEntry.date,
          lastUpdatedAt: new Date().toISOString(),
          lastUpdatedBy: this.currentUser || originalEntry.author
        }
        this.saveEntries()
        try { await createOrUpdateEntry(this.entries[index]) } catch (e) { console.error('Failed to sync update to Firebase:', e) }
      }
      this.editingEntry = null
      this.currentView = 'timeline'
    },
    async deleteEntry(entryId) {
      this.entries = this.entries.filter(e => e.id !== entryId)
      this.saveEntries()
      try { await removeEntryByClientId(entryId) } catch (e) { console.error('Failed to remove from Firebase:', e) }
    },
    cancelEdit() {
      this.editingEntry = null
      this.currentView = 'timeline'
    },
    saveEntries() {
      console.log('Saving', this.entries.length, 'entries to localStorage')
      localStorage.setItem('journalEntries', JSON.stringify(this.entries))
    }
  }
}
</script>

<style>
:root {
  --body-bg: #FF5EE2;
  --app-bg: #FF5EE2;
  --surface: white;
  --surface-2: #87006D;
  --text: #333;
  --text-muted: #999;
  --border: rgba(0, 0, 0, 0.05);
  --accent: #FF5EE2;
  --accent-soft: rgba(255, 94, 226, 0.3);
  --danger: #e74c3c;
  --shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  --btn-text: white;
  --btn-border: white;
  --btn-hover-bg: white;
  --btn-hover-text: #87006D;
  --btn-active-bg: white;
  --btn-active-text: #87006D;
  --input-bg: white;
  --input-color: #333;
  --input-border: #fc8ced;
}

.dark-mode {
  --body-bg: #05060a;
  --app-bg: #05060a;
  --surface: #101420;
  --surface-2: #151a2a;
  --text: #e8ecff;
  --text-muted: #a0a8c4;
  --border: #232a3a;
  --accent: #7f52ff;
  --accent-soft: rgba(127, 82, 255, 0.28);
  --danger: #ec6c6c;
  --shadow: 0 10px 50px rgba(0,0,0,0.75);
  --btn-text: #e8ecff;
  --btn-border: #e8ecff;
  --btn-hover-bg: #e8ecff;
  --btn-hover-text: #151a2a;
  --btn-active-bg: #e8ecff;
  --btn-active-text: #151a2a;
  --input-bg: #151a2a;
  --input-color: #e8ecff;
  --input-border: #2c3345;
}

/* ensure the document and app root fill the viewport so backgrounds cover full page */
html, body, #app {
  height: 100%;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* set global background so edges never show white */
body {
  margin: 0;
  min-height: 100vh;
  background: var(--body-bg);
  color: var(--text);
}

body.dark-mode {
  --body-bg: #05060a;
  --app-bg: #05060a;
  --surface: #101420;
  --surface-2: #151a2a;
  --text: #e8ecff;
  --text-muted: #a0a8c4;
  --border: #232a3a;
  --accent: #7f52ff;
  --accent-soft: rgba(127, 82, 255, 0.28);
  --danger: #ec6c6c;
  --shadow: 0 10px 50px rgba(0,0,0,0.75);
  background: var(--body-bg);
  color: var(--text);
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  color: var(--text);
  background: var(--app-bg);
}

.navbar {
  background: var(--surface-2);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow);
  sticky: top 0;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  left: 0;
}

.nav-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
}

.logo {
  font-size: 1.8rem;
  color: white;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.theme-toggle {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--btn-border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--btn-text);
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.theme-toggle:hover {
  transform: scale(1.08);
  background: var(--accent-soft);
}

.nav-btn {
  padding: 0.6rem 1.5rem;
  border: 2px solid var(--btn-border);
  background: transparent;
  color: var(--btn-text);
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: var(--btn-hover-bg);
  color: var(--btn-hover-text);
}

.nav-btn.active {
  background: var(--btn-active-bg);
  color: var(--btn-active-text);
}

.logout-btn {
  border-color: var(--accent);
  color: var(--accent);
}

.logout-btn:hover {
  background: var(--accent);
  color: var(--surface-2);
}

.user-info {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 2rem;
  background: var(--surface);
  color: var(--text);
  font-weight: 500;
  border-bottom: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow);
}

.user-info strong {
  color: #87006D;
  font-size: 1.1rem;
}

.main-content {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
  background: var(--app-bg);
}

@media (max-width: 600px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    width: 100%;
    justify-content: space-between;
  }

  .logo {
    font-size: 1.4rem;
  }

  .nav-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
