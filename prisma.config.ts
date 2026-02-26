import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

// Încarcă variabilele din .env
config()

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  }
})