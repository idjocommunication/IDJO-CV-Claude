import { prixLisible } from '@/lib/paiement'
import { SITE } from '@/lib/seo'

/**
 * Page imprimée à la place du CV hors d'une séance de téléchargement payée.
 * Elle remplace la feuille dans la copie d'impression : un Ctrl+P ne peut donc
 * pas sortir le CV sans passer par le paiement.
 */
export function DocumentVerrouille() {
  return (
    <div className="cv-sheet">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 'inherit',
          padding: '0 90px',
          textAlign: 'center',
          color: '#0E2447',
        }}
      >
        <p style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Document verrouillé
        </p>
        <p style={{ margin: '18px 0 0', fontSize: 14, lineHeight: 1.7, color: '#5A6E8C' }}>
          Votre CV est prêt, mais le téléchargement n’a pas encore été réglé.
          Retournez sur {SITE.domain} et cliquez sur « Télécharger le PDF »
          ({prixLisible()} par téléchargement).
        </p>
        <p style={{ margin: '28px 0 0', fontSize: 12, color: '#8FA3BF' }}>
          Aucune information saisie n’est perdue : elle reste dans votre navigateur.
        </p>
      </div>
    </div>
  )
}
