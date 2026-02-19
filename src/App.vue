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
      entries: [
        {
          id: 1,
          author: 'Kamilah',
          date: new Date('2025-02-15').toISOString(),
          title: 'Our First Entry',
          content: 'This is the first moment we\'re sharing together in this journal. Here\'s to many more memories.',
          mood: '❤️',
          photo: null
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
    addEntry(entryData) {
      const newEntry = {
        id: Math.max(...this.entries.map(e => e.id), 0) + 1,
        author: entryData.author,
        date: entryData.date,
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        photo: entryData.photo || null
      }
      this.entries.unshift(newEntry)
      this.saveEntries()
      this.currentView = 'timeline'
    },
    editEntry(entry) {
      this.editingEntry = entry
      this.currentView = 'new'
    },
    updateEntry(entryData) {
      const index = this.entries.findIndex(e => e.id === entryData.id)
      if (index !== -1) {
        this.entries[index] = {
          ...this.entries[index],
          title: entryData.title,
          content: entryData.content,
          mood: entryData.mood,
          photo: entryData.photo || null,
          date: entryData.date
        }
        this.saveEntries()
      }
      this.editingEntry = null
      this.currentView = 'timeline'
    },
    deleteEntry(entryId) {
      this.entries = this.entries.filter(e => e.id !== entryId)
      this.saveEntries()
    },
    cancelEdit() {
      this.editingEntry = null
      this.currentView = 'timeline'
    },
    saveEntries() {
      localStorage.setItem('journalEntries', JSON.stringify(this.entries))
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  sticky: top 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.8rem;
  color: #667eea;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-btn {
  padding: 0.6rem 1.5rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: #667eea;
  color: white;
}

.nav-btn.active {
  background: #667eea;
  color: white;
}

.logout-btn {
  border-color: #e74c3c;
  color: #e74c3c;
}

.logout-btn:hover {
  background: #e74c3c;
  color: white;
}

.user-info {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.user-info strong {
  color: #667eea;
  font-size: 1.1rem;
}

.main-content {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
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
