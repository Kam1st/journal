<template>
  <div id="app">
    <LoginPage v-if="!currentUser" @login="handleLogin" />
    
    <div v-else>
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="logo">💕 our new journal</h1>
          <div class="nav-links">
            <button 
              :class="['nav-btn', { active: currentView === 'timeline' }]"
              @click="currentView = 'timeline'"
            >
              Timeline
            </button>
            <button 
              :class="['nav-btn', { active: currentView === 'new' }]"
              @click="currentView = 'new'"
            >
              New Entry
            </button>
            <button class="nav-btn logout-btn" @click="handleLogout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div class="user-info">
        <span>👤 Logged in as: <strong>{{ currentUser }}</strong></span>
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
  background: #FF5EE2;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  color: #333;
}

.navbar {
  background: #87006D;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

.nav-btn {
  padding: 0.6rem 1.5rem;
  border: 2px solid white;
  background: transparent;
  color: white;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: white;
  color: #87006D;
}

.nav-btn.active {
  background: white;
  color: #87006D;
}

.logout-btn {
  border-color: #FF5EE2;
  color: #FF5EE2;
}

.logout-btn:hover {
  background: #FF5EE2;
  color: white;
}

.user-info {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 2rem;
  background: white;
  color: #333;
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}

.user-info strong {
  color: #87006D;
  font-size: 1.1rem;
}

.main-content {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
  background: transparent;
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
