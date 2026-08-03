import { NextResponse } from 'next/server'
import { isDatabaseReady, prisma } from '@/lib/prisma'
import { saveCvSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Enregistre un CV côté serveur (synchronisation multi-appareils). */
export async function POST(request: Request) {
  if (!isDatabaseReady) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Aucune base de données configurée. Votre CV reste enregistré dans ce navigateur et exportable en PDF.',
      },
      { status: 503 },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête illisible.' }, { status: 400 })
  }

  const parsed = saveCvSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Données invalides.', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { title, data, ownerEmail } = parsed.data

  try {
    const user = ownerEmail
      ? await prisma.user.upsert({
          where: { email: ownerEmail },
          update: {},
          create: { email: ownerEmail },
        })
      : null

    const document = await prisma.document.create({
      data: {
        title,
        template: data.settings.template,
        data,
        userId: user?.id,
      },
    })

    return NextResponse.json({ ok: true, id: document.id }, { status: 201 })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Enregistrement impossible pour le moment.' },
      { status: 500 },
    )
  }
}

/** Relit un CV enregistré : /api/cv?id=… */
export async function GET(request: Request) {
  if (!isDatabaseReady) {
    return NextResponse.json({ ok: false, error: 'Base de données non configurée.' }, { status: 503 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Identifiant manquant.' }, { status: 400 })
  }

  try {
    const document = await prisma.document.findUnique({ where: { id } })
    if (!document) {
      return NextResponse.json({ ok: false, error: 'CV introuvable.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, document })
  } catch {
    return NextResponse.json({ ok: false, error: 'Lecture impossible.' }, { status: 500 })
  }
}
