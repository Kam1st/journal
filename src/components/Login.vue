<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">💕 our new journal</h1>
      <p class="subtitle">who's making the entry rn?</p>

      <div class="button-group">
        <button 
          class="login-btn kamilah-btn"
          @click="selectUser('Kamilah')"
        >
          <span class="emoji">🦦</span>
          <span class="name">Kamilah</span>
        </button>
        <button 
          class="login-btn jeremy-btn"
          @click="selectUser('Jeremy')"
        >
          <span class="emoji">🐧</span>
          <span class="name">Jeremy</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  emits: ['login'],
  methods: {
    selectUser(username) {
      this.$emit('login', username)
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #FF5EE2;
  padding: 2rem;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.title {
  font-size: 2.5rem;
  color: black;
  margin: 0 0 1rem 0;
}

.subtitle {
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 3rem;
}

.button-group {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-direction: column;
}

.login-btn {
  padding: 2rem;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.emoji {
  font-size: 3rem;
}

.name {
  font-size: 1.3rem;
  letter-spacing: 0.5px;
}

.kamilah-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.kamilah-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(245, 87, 108, 0.4);
}

.jeremy-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.jeremy-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(79, 172, 254, 0.4);
}

.hint {
  color: #999;
  font-size: 0.95rem;
  margin: 0;
}

@media (max-width: 600px) {
  .login-card {
    padding: 2rem;
  }

  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  .button-group {
    gap: 1.5rem;
  }

  .login-btn {
    padding: 1.5rem;
  }

  .emoji {
    font-size: 2.5rem;
  }

  .name {
    font-size: 1.1rem;
  }
}
</style>
