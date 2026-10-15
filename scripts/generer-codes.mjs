#!/usr/bin/env node
/**
 * Fabrique des codes d'accès à remettre aux clients qui ont réglé sur le lien
 * CinetPay.   PAIEMENT_SECRET=... node scripts/generer-codes.mjs [nombre]
 * Le secret doit être le même que celui du site, sinon les codes seront refusés.
 */
import { createHmac, randomInt } from 'node:crypto'

const SECRET = process.env.PAIEMENT_SECRET
if (!SECRET) {
  console.error('PAIEMENT_SECRET est requis (le même que sur le site).')
  process.exit(1)
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const n = Math.min(Math.max(Number(process.argv[2]) || 1, 1), 500)

for (let i = 0; i < n; i++) {
  const serie = Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  const h = createHmac('sha256', SECRET).update(`code:${serie}`).digest()
  const marque = Array.from(h.subarray(0, 8), (o) => ALPHABET[o % ALPHABET.length]).join('')
  console.log(`IDJO-${serie}-${marque}`)
}
