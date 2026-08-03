'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Check,
  CreditCard,
  Download,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Field, TextInput } from '@/components/editor/fields'
import { useCvStore } from '@/lib/store'
import {
  MOYENS,
  PAIEMENT,
  dateLisible,
  enregistrerAcces,
  prixLisible,
  type DocumentPayant,
} from '@/lib/paiement'
import {
  dernierEmail,
  envoiDisponible,
  envoyerParEmail,
  lireLivraison,
  oublierLivraison,
  retenirLivraison,
} from '@/lib/envoi'
import { PRINT_LABELS, printDocument } from '@/lib/print'
import { useAcces } from '@/lib/use-acces'
import { cn, fullName } from '@/lib/utils'

type Etape = 'coordonnees' | 'redirection' | 'envoi' | 'envoye' | 'erreur'

const TITRES: Record<DocumentPayant, string> = {
  cv: 'votre CV',
  lettre: 'votre lettre de motivation',
  tout: 'votre CV et votre lettre',
}

/**
 * Coordonnées de livraison, puis règlement.
 *
 * Le client indique l'adresse e-mail sur laquelle il veut recevoir son PDF et,
 * quand le téléchargement est payant, le numéro Mobile Money qui sera débité.
 * Le règlement lui-même a lieu sur la page sécurisée de l'agrégateur : ni le
 * numéro complet, ni le code secret ne transitent par IDJÔ CV. Le document
 * part par e-mail une fois le débit confirmé.
 */
export function TelechargementDialog({
  document: cible,
  onClose,
  onTelecharger,
}: {
  document: DocumentPayant
  onClose: () => void
  onTelecharger: (cible: DocumentPayant) => void
}) {
  const profil = useCvStore((s) => s.data.profile)
  const { autorise } = useAcces()
  const [etape, setEtape] = useState<Etape>('coordonnees')
  const [erreur, setErreur] = useState('')
  /** L'envoi par e-mail est-il actif sur ce site ? `null` tant qu'on l'ignore. */
  const [envoiActif, setEnvoiActif] = useState<boolean | null>(null)
  const [form, setForm] = useState({ nom: '', telephone: '', email: '' })
  const panneau = useRef<HTMLDivElement>(null)

  const doitPayer = !autorise

  // Pré-remplissage : ce que le client a déjà saisi dans son CV.
  useEffect(() => {
    setForm({
      nom: fullName(profil.firstName, profil.lastName),
      telephone: profil.phone ?? '',
      email: dernierEmail() || profil.email || '',
    })
  }, [profil.firstName, profil.lastName, profil.phone, profil.email])

  useEffect(() => {
    let vivant = true
    void envoiDisponible().then((actif) => vivant && setEnvoiActif(actif))
    return () => {
      vivant = false
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const emailValide = /.+@.+\..+/.test(form.email.trim())
  const complet = doitPayer
    ? emailValide && form.nom.trim().length >= 2 && form.telephone.replace(/\D/g, '').length >= 8
    : emailValide

  const payer = async () => {
    setEtape('redirection')
    setErreur('')
    // L'adresse survit à l'aller-retour : au retour, le document part tout seul.
    retenirLivraison({ email: form.email.trim(), nom: form.nom.trim(), document: cible })

    try {
      const response = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom.trim(),
          telephone: form.telephone.trim(),
          email: form.email.trim(),
          document: cible,
        }),
      })
      const json = (await response.json()) as { url?: string; reference?: string; error?: string }

      if (!response.ok || !json.url) {
        setErreur(json.error ?? 'Le paiement n’a pas pu être ouvert.')
        setEtape('erreur')
        return
      }

      window.sessionStorage.setItem('idjo-cv:paiement-en-cours', json.reference ?? '')
      window.location.href = json.url
    } catch {
      setErreur('Connexion impossible. Vérifiez votre réseau et réessayez.')
      setEtape('erreur')
    }
  }

  const envoyer = async () => {
    setEtape('envoi')
    setErreur('')
    retenirLivraison({ email: form.email.trim(), nom: form.nom.trim(), document: cible })

    const resultat = await envoyerParEmail({
      document: cible,
      email: form.email.trim(),
      nom: form.nom.trim(),
    })

    if (resultat === 'envoye') {
      setEtape('envoye')
      return
    }

    // Seule l'absence de configuration retire le bouton : une panne passagère
    // laisse au client la possibilité de réessayer.
    if (resultat === 'inactif') setEnvoiActif(false)
    setErreur(
      resultat === 'inactif'
        ? 'L’envoi par e-mail n’est pas encore actif sur ce site. Votre document reste téléchargeable ici.'
        : resultat === 'acces-invalide'
          ? 'Votre accès au téléchargement a expiré. Réglez à nouveau pour recevoir votre document.'
          : 'L’envoi n’a pas abouti. Réessayez, ou téléchargez votre document sur cet appareil.',
    )
    setEtape('erreur')
  }

  const telecharger = () => {
    onTelecharger(cible)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-navy-900/60 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (!panneau.current?.contains(event.target as Node)) onClose()
      }}
    >
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-label={doitPayer ? 'Régler et recevoir le document' : 'Recevoir le document'}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-float sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-cloud-300 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-[17px] font-bold text-ink">
              {doitPayer ? (
                <Lock size={16} className="text-azur-600" />
              ) : (
                <Mail size={16} className="text-azur-600" />
              )}
              Recevoir {TITRES[cible]} en PDF
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {doitPayer
                ? `${prixLisible()} — ${PAIEMENT.dureeJours} jours de téléchargements illimités, CV et lettre compris.`
                : 'Indiquez l’adresse e-mail sur laquelle vous voulez recevoir votre document.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {etape === 'redirection' ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Loader2 size={26} className="animate-spin text-azur-600" />
              <p className="text-sm font-semibold text-ink">Ouverture de la page de paiement…</p>
              <p className="max-w-xs text-[12px] text-ink-muted">
                Vous allez choisir Wave, Orange Money, MTN, Moov ou votre carte.
              </p>
            </div>
          ) : null}

          {etape === 'envoi' ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Loader2 size={26} className="animate-spin text-azur-600" />
              <p className="text-sm font-semibold text-ink">Préparation de votre PDF…</p>
              <p className="max-w-xs text-[12px] text-ink-muted">
                Le document part vers {form.email.trim()}.
              </p>
            </div>
          ) : null}

          {etape === 'envoye' ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <MailCheck size={30} className="text-azur-600" />
              <p className="text-sm font-semibold text-ink">Document envoyé</p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-muted">
                {PRINT_LABELS[cible]} part vers <strong>{form.email.trim()}</strong>. Regardez aussi
                le dossier « courrier indésirable » : les pièces jointes y atterrissent parfois.
              </p>
            </div>
          ) : null}

          {etape === 'coordonnees' || etape === 'erreur' ? (
            <>
              {doitPayer ? (
                <>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {MOYENS.map((moyen) => (
                      <span
                        key={moyen.id}
                        className="inline-flex items-center gap-2 rounded-full border border-cloud-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink"
                      >
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: moyen.teinte }}
                        />
                        {moyen.nom}
                      </span>
                    ))}
                  </div>

                  <ol className="mb-5 grid gap-1.5 rounded-xl bg-cloud px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
                    <li>
                      <strong className="text-ink">1.</strong> Vos coordonnées ci-dessous.
                    </li>
                    <li>
                      <strong className="text-ink">2.</strong> Paiement Mobile Money sur la page
                      sécurisée de notre partenaire.
                    </li>
                    <li>
                      <strong className="text-ink">3.</strong> Vous validez le débit sur votre
                      téléphone.
                    </li>
                    <li>
                      <strong className="text-ink">4.</strong>{' '}
                      {envoiActif === false
                        ? 'Votre PDF se télécharge aussitôt sur cet appareil.'
                        : 'Votre PDF arrive sur votre e-mail.'}
                    </li>
                  </ol>
                </>
              ) : null}

              <div className="grid gap-4">
                <Field
                  label="E-mail"
                  hint={
                    envoiActif === false
                      ? 'L’envoi par e-mail n’est pas encore actif : votre PDF se télécharge ici.'
                      : 'Vous y recevez votre CV en PDF, en pièce jointe.'
                  }
                >
                  <TextInput
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    placeholder="prenom.nom@email.ci"
                  />
                </Field>

                {doitPayer ? (
                  <>
                    <Field
                      label="Numéro Mobile Money"
                      hint="Le numéro qui sera débité. La demande de confirmation arrive dessus."
                    >
                      <TextInput
                        value={form.telephone}
                        onChange={(v) => setForm((f) => ({ ...f, telephone: v }))}
                        placeholder="+225 07 07 12 34 56"
                      />
                    </Field>
                    <Field label="Nom complet">
                      <TextInput
                        value={form.nom}
                        onChange={(v) => setForm((f) => ({ ...f, nom: v }))}
                        placeholder="Aïcha Konaté"
                      />
                    </Field>
                  </>
                ) : null}
              </div>

              {erreur ? (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
                  {erreur}
                </p>
              ) : null}

              <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-ink-muted">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-azur-600" />
                {doitPayer
                  ? 'Le règlement s’effectue sur la page sécurisée de notre partenaire de paiement. IDJÔ CV ne voit ni votre code secret, ni votre solde, ni vos identifiants bancaires.'
                  : 'Votre adresse sert uniquement à l’envoi de ce document. Elle n’est ni conservée sur nos serveurs, ni transmise à qui que ce soit.'}
              </p>
            </>
          ) : null}
        </div>

        <footer className="border-t border-cloud-300 px-6 py-4">
          {etape === 'coordonnees' || etape === 'erreur' ? (
            <>
              {doitPayer ? (
                <button
                  type="button"
                  disabled={!complet}
                  onClick={payer}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-azur-btn text-[15px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                >
                  <CreditCard size={17} />
                  Payer {prixLisible()}
                </button>
              ) : (
                <>
                  {envoiActif === false ? null : (
                    <button
                      type="button"
                      disabled={!complet}
                      onClick={envoyer}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-azur-btn text-[15px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50"
                    >
                      <Mail size={17} />
                      Recevoir par e-mail
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={telecharger}
                    className={cn(
                      'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-cloud-400 text-[14px] font-semibold text-ink transition-colors hover:border-azur-400 hover:text-navy-700',
                      envoiActif === false ? 'h-12 border-0 bg-azur-btn text-white' : 'mt-2',
                    )}
                  >
                    <Download size={16} />
                    Télécharger sur cet appareil
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full text-center text-[12px] font-semibold text-ink-muted underline underline-offset-2 hover:text-ink"
              >
                Continuer à modifier mon document
              </button>
            </>
          ) : null}

          {etape === 'envoye' ? (
            <>
              <button
                type="button"
                onClick={telecharger}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-cloud-400 text-[14px] font-semibold text-ink transition-colors hover:border-azur-400 hover:text-navy-700"
              >
                <Download size={16} />
                Télécharger aussi sur cet appareil
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full text-center text-[12px] font-semibold text-ink-muted underline underline-offset-2 hover:text-ink"
              >
                Fermer
              </button>
            </>
          ) : null}
        </footer>
      </div>
    </div>
  )
}

/**
 * Bandeau de retour de paiement. Il interroge l'agrégateur tant que la
 * transaction n'est pas confirmée : sur Mobile Money, la validation par
 * l'utilisateur peut prendre une minute. Dès que le débit est confirmé, le
 * document part sur l'adresse indiquée avant le paiement.
 */
export function RetourPaiement({ reference, onFini }: { reference: string; onFini: () => void }) {
  const [etat, setEtat] = useState<'attente' | 'paye' | 'refuse'>('attente')
  const [expire, setExpire] = useState(0)
  const [envoi, setEnvoi] = useState<'aucun' | 'encours' | 'envoye' | 'inactif' | 'echec'>('aucun')
  const [destinataire, setDestinataire] = useState('')
  const [cible, setCible] = useState<DocumentPayant>('cv')

  useEffect(() => {
    let vivant = true
    let essais = 0

    const demander = async () => {
      essais += 1
      try {
        const response = await fetch(`/api/paiement/statut?reference=${encodeURIComponent(reference)}`)
        const json = (await response.json()) as {
          etat?: string
          token?: string
          expire?: number
        }

        if (!vivant) return

        if (json.etat === 'paye' && json.token && json.expire) {
          enregistrerAcces({ token: json.token, expire: json.expire, reference })
          window.sessionStorage.removeItem('idjo-cv:paiement-en-cours')
          setExpire(json.expire)
          setEtat('paye')
          return
        }
        if (json.etat === 'refuse') {
          setEtat('refuse')
          return
        }
      } catch {
        /* on retentera */
      }

      // Une trentaine de tentatives espacées de 3 s : deux bonnes minutes.
      if (vivant && essais < 30) window.setTimeout(demander, 3000)
      else if (vivant) setEtat('refuse')
    }

    void demander()
    return () => {
      vivant = false
    }
  }, [reference])

  // Débit confirmé : le document part sur l'adresse laissée avant le paiement.
  useEffect(() => {
    if (etat !== 'paye') return
    const livraison = lireLivraison()
    if (!livraison) return

    setDestinataire(livraison.email)
    setCible(livraison.document as DocumentPayant)
    setEnvoi('encours')

    // L'accès vient d'être accordé : les copies imprimables ne sont dans la
    // page qu'au rendu suivant.
    const minuteur = window.setTimeout(async () => {
      const resultat = await envoyerParEmail({
        document: livraison.document,
        email: livraison.email,
        nom: livraison.nom,
      })
      setEnvoi(resultat === 'envoye' ? 'envoye' : resultat === 'inactif' ? 'inactif' : 'echec')
      if (resultat === 'envoye') oublierLivraison()
    }, 600)

    return () => window.clearTimeout(minuteur)
  }, [etat])

  return (
    <div className="fixed inset-x-0 bottom-0 z-[105] px-4 pb-4 sm:bottom-6 sm:right-6 sm:left-auto sm:px-0">
      <div
        className={cn(
          'mx-auto flex max-w-md items-start gap-3 rounded-2xl border p-4 shadow-float',
          etat === 'paye'
            ? 'border-azur-300 bg-white'
            : etat === 'refuse'
              ? 'border-amber-300 bg-amber-50'
              : 'border-cloud-400 bg-white',
        )}
        role="status"
      >
        {etat === 'attente' ? <Loader2 size={18} className="mt-0.5 animate-spin text-azur-600" /> : null}
        {etat === 'paye' ? <Check size={18} className="mt-0.5 text-azur-600" /> : null}

        <div className="flex-1">
          <p className="text-[13px] font-bold text-ink">
            {etat === 'attente'
              ? 'Confirmation du paiement…'
              : etat === 'paye'
                ? 'Paiement confirmé'
                : 'Paiement non confirmé'}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
            {etat === 'attente'
              ? 'Validez la demande sur votre téléphone. Cette page se met à jour toute seule.'
              : etat === 'paye'
                ? `Téléchargements ouverts jusqu’au ${dateLisible(expire)}.`
                : 'Aucun règlement n’a été enregistré pour cette transaction. Si votre compte a été débité, écrivez-nous avec la référence ci-dessous.'}
          </p>

          {etat === 'paye' && envoi !== 'aucun' ? (
            <p
              className={cn(
                'mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed',
                envoi === 'echec' ? 'text-amber-800' : 'text-navy-700',
              )}
            >
              {envoi === 'encours' ? (
                <Loader2 size={13} className="mt-0.5 shrink-0 animate-spin" />
              ) : envoi === 'envoye' ? (
                <MailCheck size={13} className="mt-0.5 shrink-0" />
              ) : (
                <Download size={13} className="mt-0.5 shrink-0" />
              )}
              {envoi === 'encours'
                ? `Envoi de votre PDF vers ${destinataire}…`
                : envoi === 'envoye'
                  ? `PDF envoyé à ${destinataire}.`
                  : envoi === 'inactif'
                    ? 'Ce site n’envoie pas encore les documents par e-mail : récupérez votre PDF ci-dessous.'
                    : 'L’envoi par e-mail n’a pas abouti : téléchargez votre document ci-dessous.'}
            </p>
          ) : null}

          {etat === 'paye' ? (
            <button
              type="button"
              onClick={() => printDocument(cible)}
              className="mt-2.5 inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-[12.5px] font-semibold text-white hover:bg-ink-soft"
            >
              <Download size={14} />
              Télécharger maintenant
            </button>
          ) : null}

          {etat !== 'attente' ? (
            <p className="mt-2 font-mono text-[10px] text-ink-muted">{reference}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onFini}
          className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
