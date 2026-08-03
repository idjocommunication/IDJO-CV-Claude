import { PrismaClient } from '@prisma/client'

/**
 * Client Prisma partagé. La plateforme reste utilisable sans base de données
 * (l'éditeur enregistre en local) : les routes API vérifient `isDatabaseReady`
 * avant toute requête et répondent proprement si aucune base n'est configurée.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const isDatabaseReady = Boolean(process.env.DATABASE_URL)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
