#!/usr/bin/env node

/**
 * Database seed script
 *
 * Creates fixed test accounts: admin (administrator) and user (regular user)
 *
 * Usage: pnpm run db:seed
 */

import bcrypt from 'bcrypt'
import { config } from 'dotenv'

import { createPrismaClient, UserRole } from '../src/index'

config({ path: '.env' })

const TEST_ACCOUNTS = [
  {
    email: 'admin@example.com',
    username: 'admin',
    name: 'Admin',
    role: UserRole.ADMIN,
    password: '12345678',
  },
  {
    email: 'user@example.com',
    username: 'user',
    name: 'User',
    role: UserRole.USER,
    password: '12345678',
  },
] as const

const APP_SETTINGS = {
  maintenance: { on: false },
  announcements: { items: [] },
  pricing: {
    pointsPer1000: 25,
    minVnd: 2000,
    maxVnd: 100_000,
    packs: [
      { vnd: 2000, bonus: 0 },
      { vnd: 5000, bonus: 0.05 },
      { vnd: 10_000, bonus: 0.1 },
      { vnd: 20_000, bonus: 0.15 },
      { vnd: 50_000, bonus: 0.2 },
    ],
    defaultVnd: 10_000,
  },
} as const

async function seed() {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not configured')
    process.exit(1)
  }

  console.log('🔄 Connecting to database...')

  const prisma = createPrismaClient({ datasourceUrl: databaseUrl })

  try {
    for (const [key, value] of Object.entries(APP_SETTINGS)) {
      // update: {} keeps values an admin already edited
      await prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: {} })
      console.log(`✅ app_settings.${key} ready`)
    }

    for (const account of TEST_ACCOUNTS) {
      console.log(`🔍 Checking account: ${account.email}`)

      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: account.email }, { username: account.username }],
        },
      })

      if (existing) {
        console.log(`✅ ${account.email} already exists, skipping`)
        continue
      }

      const userId = crypto.randomUUID()
      const passwordHash = await bcrypt.hash(account.password, 10)

      await prisma.user.create({
        data: {
          id: userId,
          name: account.name,
          email: account.email,
          username: account.username,
          displayUsername: account.username,
          role: account.role,
          accounts: {
            create: {
              id: crypto.randomUUID(),
              providerId: 'email',
              accountId: account.email,
              password: passwordHash,
            },
          },
        },
      })

      console.log(`✅ ${account.email} (role: ${account.role}) created successfully`)
    }
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔒 Database connection closed')
  }
}

await seed()
