import { TEMPLATES } from '@/data/templates'
import { THEMES } from '@/lib/theme'

/**
 * Offres réellement disponibles aujourd'hui. Tant qu'il n'existe ni compte ni
 * encaissement en ligne, la plateforme est intégralement gratuite et la seule
 * prestation payante est humaine, réservée par message. Ne rien ajouter ici
 * qui ne soit pas livrable le jour même.
 */
/**
 * Offres réellement disponibles. La création, l'aperçu, l'assistant et
 * l'analyse ATS sont gratuits ; seul le téléchargement du document final est
 * payant, par Mobile Money ou carte. Ne rien annoncer ici qui ne soit pas
 * livrable le jour même.
 */
export const PLANS = [
  {
    id: 'creation',
    name: 'Création',
    price: 0,
    priceLabel: '0 F CFA',
    period: 'sans compte, sans limite de temps',
    description: 'Composez votre CV et votre lettre, autant que vous voulez.',
    features: [
      'Les 8 modèles et les 24 palettes',
      'Aperçu A4 en temps réel',
      'Assistant de rédaction',
      'Analyse ATS de votre CV',
      'Import d’un CV existant (PDF, Word)',
      'Sauvegarde .json sur votre appareil',
    ],
    cta: 'Créer mon CV',
    href: '/editeur',
    highlight: false,
  },
  {
    id: 'telechargement',
    name: 'Téléchargement',
    price: 4900,
    priceLabel: '4 900 F CFA',
    period: 'paiement unique · 30 jours d’accès',
    description: 'Le PDF final, prêt à envoyer, sans filigrane.',
    features: [
      'Export PDF A4 du CV',
      'Export PDF de la lettre de motivation',
      'Téléchargements illimités pendant 30 jours',
      'Autant de modifications et de versions que voulu',
      'Wave, Orange Money, MTN, Moov ou carte bancaire',
      'Aucun abonnement, aucun prélèvement automatique',
    ],
    cta: 'Composer puis télécharger',
    href: '/editeur',
    highlight: true,
  },
  {
    id: 'accompagnement',
    name: 'Accompagnement',
    price: 19000,
    priceLabel: '19 000 F CFA',
    period: 'prestation unique, sur rendez-vous',
    description: 'Un consultant RH relit, réécrit et cible votre candidature.',
    features: [
      'Tout le contenu du téléchargement',
      'Relecture par un consultant RH ivoirien',
      'Réécriture des accroches et des missions',
      'Optimisation pour un poste ciblé',
      'Appel de 30 minutes de préparation',
    ],
    cta: 'Demander un créneau',
    href: '/contact?sujet=accompagnement',
    highlight: false,
  },
] as const

export const FEATURES = [
  {
    icon: 'LayoutTemplate',
    title: 'Huit modèles, vingt-quatre palettes',
    description:
      'Des mises en page validées par des recruteurs, déclinables en vingt-quatre couleurs et neuf typographies — ou la teinte exacte de votre choix. Vous changez tout sans ressaisir une ligne.',
  },
  {
    icon: 'ScanLine',
    title: 'Analyse ATS intégrée',
    description:
      'Un score sur 100 et des corrections concrètes, calculés dans votre navigateur : coordonnées, structure, résultats chiffrés, verbes d’action.',
  },
  {
    icon: 'Wifi',
    title: 'Léger, même en 3G',
    description:
      'Pages optimisées, rendu instantané et sauvegarde locale : la plateforme reste fluide sur mobile et avec une connexion limitée.',
  },
  {
    icon: 'FileDown',
    title: 'Export PDF fidèle',
    description:
      'Format A4, marges maîtrisées, couleurs conservées à l’impression. Ce que vous voyez est exactement ce que le recruteur reçoit.',
  },
  {
    icon: 'Languages',
    title: 'Pensé pour la région',
    description:
      'Numéros ivoiriens, diplômes locaux, langues nationales, montants en FCFA : les champs correspondent à votre réalité.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Vos données restent à vous',
    description:
      'Aucune revente de données, aucun compte obligatoire pour démarrer. Votre CV vit dans votre navigateur tant que vous ne l’enregistrez pas.',
  },
] as const

export const STEPS = [
  {
    number: '01',
    title: 'Choisissez un modèle',
    description:
      'Quatre mises en page, du plus dense au plus aéré. Sélectionnez celle qui correspond à votre secteur.',
  },
  {
    number: '02',
    title: 'Remplissez vos informations',
    description:
      'Formulaire guidé, exemples de formulations et aperçu en direct de la feuille A4 pendant la saisie.',
  },
  {
    number: '03',
    title: 'Choisissez vos couleurs',
    description:
      'Palette, dose de couleur, typographie, taille du texte, photo ou non : le CV s’adapte à votre secteur et à vous.',
  },
  {
    number: '04',
    title: 'Exportez et postulez',
    description:
      'Téléchargez le PDF prêt à envoyer par email ou WhatsApp, et gardez votre CV pour vos prochaines candidatures.',
  },
] as const

/**
 * Engagements vérifiables, affichés à la place de témoignages clients. Aucun
 * avis ne sera publié ici tant qu'il ne proviendra pas d'un utilisateur réel
 * ayant donné son accord.
 */
export const GUARANTEES = [
  {
    title: 'On paie une fois, on télécharge autant qu’on veut',
    description:
      'Le PDF est le document final, sans filigrane. Pendant 30 jours, vous le retéléchargez à chaque candidature, avec toutes les modifications que vous voulez.',
  },
  {
    title: 'Vos données ne partent pas',
    description:
      'Le CV et la lettre restent dans votre navigateur. Pas de compte obligatoire, pas de revente, pas de traceur publicitaire.',
  },
  {
    title: 'Un vrai format A4',
    description:
      'Mesures en millimètres, marges maîtrisées, couleurs conservées à l’impression. L’éditeur vous prévient si votre CV dépasse une page.',
  },
  {
    title: 'Écrit pour la Côte d’Ivoire',
    description:
      'Numéros ivoiriens, diplômes locaux, langues nationales, montants en FCFA — et un français relu, pas traduit.',
  },
]

export const FAQ = [
  {
    question: 'Qu’est-ce qui est gratuit, qu’est-ce qui est payant ?',
    answer:
      'La création est entièrement gratuite : les huit modèles, les couleurs, la lettre de motivation, l’analyse ATS, l’assistant et l’import de votre ancien CV. Vous ne payez que le téléchargement du PDF final : 4 900 F CFA, une seule fois, pour 30 jours de téléchargements illimités.',
  },
  {
    question: 'Mon CV passera-t-il les logiciels de tri automatique (ATS) ?',
    answer:
      'Nos modèles utilisent une structure de titres claire, du texte réel (jamais d’image de texte) et un ordre de sections standard. C’est ce que les ATS savent lire. Le modèle Plateau obtient le meilleur score de lisibilité.',
  },
  {
    question: 'Faut-il créer un compte pour commencer ?',
    answer:
      'Non, et il n’y a pas de compte du tout pour le moment. L’éditeur fonctionne immédiatement et enregistre votre travail dans votre navigateur.',
  },
  {
    question: 'Comment payer depuis la Côte d’Ivoire ?',
    answer:
      'Par Wave, Orange Money, MTN MoMo, Moov Money ou carte bancaire. Le règlement se fait sur la page sécurisée de notre partenaire de paiement : IDJÔ CV ne voit jamais votre code secret ni vos identifiants bancaires. Le montant est facturé en francs CFA, une seule fois, sans abonnement.',
  },
  {
    question: 'Où sont enregistrés mon CV et ma lettre ?',
    answer:
      'Dans la mémoire de votre navigateur, sur l’appareil que vous utilisez. Rien n’est envoyé sur nos serveurs. En contrepartie, si vous videz les données de votre navigateur ou changez d’appareil, votre CV est perdu : utilisez « Télécharger → Fichier du CV (.json) » pour en garder une copie et la réimporter ensuite.',
  },
  {
    question: 'Faut-il mettre une photo sur son CV ?',
    answer:
      'En Côte d’Ivoire et dans la sous-région, la photo reste courante et bien acceptée. Utilisez un portrait net, cadré sur le visage, tenue professionnelle. Pour une candidature internationale, l’option « sans photo » est un clic.',
  },
  {
    question: 'Puis-je modifier mon CV après l’avoir téléchargé ?',
    answer:
      'Oui, autant de fois que nécessaire. Vos données restent dans l’éditeur : vous adaptez votre accroche à chaque offre et réexportez en quelques secondes.',
  },
]

/**
 * Chiffres annoncés sur la page d'accueil. Les deux dénombrements sont
 * calculés à partir des données elles-mêmes : ils étaient écrits à la main et
 * annonçaient encore quatre modèles et onze palettes bien après leur arrivée.
 */
export const STATS = [
  { value: String(TEMPLATES.length), label: 'modèles professionnels' },
  { value: '10 min', label: 'pour un CV complet' },
  { value: 'A4', label: 'export PDF fidèle' },
  { value: String(THEMES.length), label: 'palettes de couleurs' },
]
