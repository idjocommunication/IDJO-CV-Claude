'use client'

import { useState } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, TextArea, TextInput } from '@/components/editor/fields'
import { SITE, mailtoLink, whatsappLink } from '@/lib/seo'
import { SANS_SERVEUR } from '@/lib/deploiement'

type Status = 'idle' | 'loading' | 'sent' | 'error' | 'a-envoyer-soi-meme'

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }))

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setError('')

    // Export statique : rien ne réceptionne le message côté serveur, on passe
    // tout de suite la main au visiteur plutôt que d'écrire dans le vide.
    if (SANS_SERVEUR) {
      setStatus('a-envoyer-soi-meme')
      return
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = (await response.json()) as { ok?: boolean; error?: string; code?: string }

      // Le serveur n'a aucun canal d'envoi : on passe la main au visiteur
      // plutôt que de lui faire croire que le message est parti.
      if (payload.code === 'sans-transport') {
        setStatus('a-envoyer-soi-meme')
        return
      }

      // Formulaire incomplet ou trop de messages : on le dit, sans dérouter
      // le visiteur vers un autre canal.
      if (!response.ok || !payload.ok) {
        setStatus('error')
        setError(payload.error ?? 'Envoi impossible')
        return
      }

      setStatus('sent')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      // Coupure réseau : le message est déjà saisi, on propose de l'envoyer soi-même.
      setStatus('a-envoyer-soi-meme')
    }
  }

  const corps = [
    `Nom : ${form.name}`,
    `Email : ${form.email}`,
    '',
    form.message,
  ].join('\n')
  const whatsapp = whatsappLink(`${form.subject || 'Message depuis IDJÔ CV'}\n\n${corps}`)

  if (status === 'a-envoyer-soi-meme') {
    return (
      <div className="rounded-2xl border border-cloud-300 bg-cloud p-7 sm:p-9">
        <h2 className="text-xl font-bold text-ink">Votre message est prêt</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          L’envoi automatique depuis le site n’est pas encore actif. Votre message est déjà
          rédigé : un clic l’ouvre dans votre application, il ne reste qu’à l’envoyer.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={mailtoLink(form.subject || 'Message depuis IDJÔ CV', corps)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-azur-btn px-6 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
          >
            <Mail size={16} />
            Envoyer par e-mail
          </a>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-cloud-400 bg-white px-6 text-sm font-semibold text-ink transition-colors hover:border-ink"
            >
              <MessageCircle size={16} />
              Envoyer sur WhatsApp
            </a>
          ) : null}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-ink-muted">
          Si rien ne s’ouvre, écrivez directement à{' '}
          <a href={`mailto:${SITE.email}`} className="font-semibold text-navy-700 underline">
            {SITE.email}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-semibold text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          Revenir au formulaire
        </button>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-start justify-center rounded-2xl border border-cloud-300 bg-cloud p-10">
        <h2 className="text-xl font-bold text-ink">Message reçu</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Merci. Nous revenons vers vous sous 24 heures ouvrées à l’adresse indiquée.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setStatus('idle')}>
          Écrire un autre message
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-cloud-300 bg-white p-7 shadow-card sm:p-9"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom complet">
          <TextInput value={form.name} onChange={(v) => update({ name: v })} placeholder="Aïcha Konaté" />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={form.email}
            onChange={(v) => update({ email: v })}
            placeholder="prenom.nom@email.ci"
          />
        </Field>
        <Field label="Sujet" className="sm:col-span-2">
          <TextInput
            value={form.subject}
            onChange={(v) => update({ subject: v })}
            placeholder="Accompagnement, facturation, question technique…"
          />
        </Field>
        <Field label="Message" className="sm:col-span-2">
          <TextArea
            value={form.message}
            onChange={(v) => update({ message: v })}
            rows={6}
            placeholder="Décrivez votre besoin en quelques lignes."
          />
        </Field>
      </div>

      {status === 'error' ? (
        <p className="mt-5 rounded-lg bg-cloud-200 px-4 py-3 text-sm text-ink">{error}</p>
      ) : null}

      <Button type="submit" size="lg" className="mt-7 w-full" disabled={status === 'loading'}>
        {status === 'loading' ? 'Envoi…' : 'Envoyer le message'}
      </Button>
      <p className="mt-4 text-center text-xs text-ink-muted">
        Vos coordonnées servent uniquement à vous répondre.
      </p>
    </form>
  )
}
