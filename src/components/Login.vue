<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">💕 our new journal</h1>

      <!-- Firebase login form -->
      <div v-if="!loggedIn">
        <p class="subtitle">enter your credentials (now it's secure lmao)</p>
        <input 
          v-model="email" 
          type="email" 
          placeholder="Email" 
          class="login-input"
        />
        <input 
          v-model="password" 
          type="password" 
          placeholder="Password" 
          class="login-input"
        />
        <button class="login-btn" @click="loginUser">Login</button>
      </div>

      <!-- Kam/Jay selection buttons -->
      <div v-else>
        <p class="subtitle">Who's making the entry rn?</p>
        <div class="button-group">
          <button 
            class="login-btn kamilah-btn"
            @click="selectUser('Kamilah')"
          >
            <span class="emoji">🦦</span>
            <span class="name">Kam</span>
          </button>
          <button 
            class="login-btn jeremy-btn"
            @click="selectUser('Jeremy')"
          >
            <span class="emoji">🐧</span>
            <span class="name">Jay</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default {
  name: 'LoginPage',
  emits: ['login'],
  data() {
    return {
      email: '',
      password: '',
      loggedIn: false
    }
  },
  methods: {
    loginUser() {
      const auth = getAuth();
      signInWithEmailAndPassword(auth, this.email, this.password)
        .then(userCredential => {
          this.loggedIn = true;
          console.log('Logged in user email:', userCredential.user.email);
        })
        .catch(error => {
          alert(error.message);
        });
    },
    selectUser(username) {
      this.$emit('login', username);
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
  background: var(--body-bg);
  padding: 3rem;
}

.login-card {
  background: var(--surface);
  border-radius: 30px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.title {
  font-size: 2.5rem;
  color: var(--text);
  margin: 0 0 1rem 0;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.2rem;
  margin-bottom: 3rem;
}

.login-input {
  padding: 1rem;
  width: 80%;
  margin-bottom: 1rem;
  border-radius: 10px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--input-color);
  font-size: 1rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.button-group {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-direction: column;
}

.login-btn {
  padding: 20px;
  align: center;
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
  background-color: var(--accent);
}

.emoji {
  font-size: 2rem;
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

  .login-input {
    width: 100%;
  }
}
</style>