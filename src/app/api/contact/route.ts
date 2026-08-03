import { NextResponse } from 'next/server'
import { isDatabaseReady, prisma } from '@/lib/prisma'
import { contactSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Réception des messages de contact.
 *
 * Le message doit arriver quelque part : e-mail (Resend), webhook, ou base de
 * données. Si aucun de ces canaux n'est configuré, la route répond `503` avec
 * le code `sans-transport` — le formulaire bascule alors sur l'e-mail et
 * WhatsApp du visiteur. Elle ne doit **jamais** répondre « message reçu »
 * quand le message n'a été transmis à personne.
 */

/** Limitation simple par IP : 5 messages / 10 minutes et par instance. */
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

type Message = { name: string; email: string; subject: string; message: string }

/** Envoi par e-mail via Resend. */
async function sendByEmail(data: Message) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL
  const to = process.env.CONTACT_TO_EMAIL
  if (!key || !from || !to) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject: `[IDJÔ CV] ${data.subject}`,
      text: [
        `De : ${data.name} <${data.email}>`,
        `Sujet : ${data.subject}`,
        '',
        data.message,
      ].join('\n'),
    }),
  })

  if (!response.ok) {
    console.error('[contact] Resend a refusé le message :', response.status, await response.text())
    return false
  }
  return true
}

/** Envoi vers un webhook (Zapier, Make, Google Apps Script…). */
async function sendByWebhook(data: Message) {
  const url = process.env.CONTACT_WEBHOOK_URL
  if (!url) return false

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: 'idjo-cv', receivedAt: new Date().toISOString() }),
  })

  if (!response.ok) {
    console.error('[contact] Webhook en échec :', response.status)
    return false
  }
  return true
}

async function saveInDatabase(data: Message) {
  if (!isDatabaseReady) return false
  try {
    await prisma.contactMessage.create({ data })
    return true
  } catch (error) {
    console.error('[contact] Enregistrement en base impossible :', error)
    return false
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'inconnu'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Trop de messages envoyés. Réessayez dans quelques minutes.' },
      { status: 429 },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête illisible.' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(payload)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Formulaire incomplet.'
    return NextResponse.json({ ok: false, error: first }, { status: 422 })
  }

  const data = parsed.data

  // Un canal suffit ; on les tente dans l'ordre du plus direct au plus différé.
  const delivered =
    (await sendByEmail(data)) || (await sendByWebhook(data)) || (await saveInDatabase(data))

  if (!delivered) {
    return NextResponse.json(
      {
        ok: false,
        code: 'sans-transport',
        error:
          'L’envoi depuis le site n’est pas encore actif. Écrivez-nous directement, votre message est prêt.',
      },
      { status: 503 },
    )
  }

  return NextResponse.json({ ok: true })
}
