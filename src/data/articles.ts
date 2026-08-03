export interface ArticleBlock {
  type: 'p' | 'h2' | 'ul' | 'quote'
  text?: string
  items?: string[]
}

export interface Article {
  slug: string
  title: string
  excerpt: string
  readingTime: string
  updatedAt: string
  category: string
  blocks: ArticleBlock[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'reussir-son-cv-en-cote-divoire',
    title: 'Réussir son CV en Côte d’Ivoire : le guide complet',
    excerpt:
      'Structure attendue, photo ou non, mentions à éviter, format d’envoi : les règles concrètes du marché ivoirien.',
    readingTime: '7 min',
    updatedAt: '2026-01-15',
    category: 'Fondamentaux',
    blocks: [
      {
        type: 'p',
        text: "Un recruteur à Abidjan consacre en moyenne moins d'une minute à un premier tri. Votre CV doit donc répondre à trois questions immédiatement : qui êtes-vous professionnellement, qu'avez-vous déjà réalisé, et pourquoi ce poste précisément.",
      },
      { type: 'h2', text: 'La structure attendue' },
      {
        type: 'ul',
        items: [
          'Un bandeau d’identité : nom, titre du poste visé, téléphone joignable sur WhatsApp, email sérieux, ville.',
          'Une accroche de trois à quatre lignes qui résume votre profil et votre valeur.',
          'Les expériences, de la plus récente à la plus ancienne, avec des résultats chiffrés.',
          'La formation, avec le diplôme le plus élevé en premier.',
          'Les compétences, les langues (y compris les langues nationales) et éventuellement les références.',
        ],
      },
      { type: 'h2', text: 'Faut-il mettre une photo ?' },
      {
        type: 'p',
        text: "Dans la sous-région, la photo reste courante et rarement pénalisante. Choisissez un portrait net, cadré sur le visage, fond neutre et tenue professionnelle. Pour une candidature vers l'Europe ou le Canada, retirez-la : là-bas, elle peut au contraire desservir.",
      },
      { type: 'h2', text: 'Les erreurs qui coûtent un entretien' },
      {
        type: 'ul',
        items: [
          'Un email fantaisiste : privilégiez prenom.nom@…',
          'Des missions décrites au conditionnel ou sans verbe d’action.',
          'Deux pages pour trois ans d’expérience : restez sur une page.',
          'Un fichier Word qui se décale à l’ouverture. Envoyez toujours un PDF.',
          'Un numéro sur lequel vous ne répondez pas dans la journée.',
        ],
      },
      {
        type: 'quote',
        text: "Un CV n'est pas votre biographie : c'est un argumentaire de vente d'une page.",
      },
      { type: 'h2', text: 'Le format d’envoi' },
      {
        type: 'p',
        text: "Nommez votre fichier « CV_Prenom_Nom_Poste.pdf ». C'est ce nom qui apparaît dans la boîte du recruteur et dans son classement de fichiers. Envoyez en PDF, jamais en capture d'écran, même sur WhatsApp.",
      },
    ],
  },
  {
    slug: 'cv-compatible-ats',
    title: 'Passer les filtres ATS : ce que lisent vraiment les logiciels',
    excerpt:
      'Les grands groupes et cabinets filtrent les candidatures automatiquement. Voici comment rester lisible par la machine.',
    readingTime: '6 min',
    updatedAt: '2026-02-02',
    category: 'Optimisation',
    blocks: [
      {
        type: 'p',
        text: "Un ATS (Applicant Tracking System) extrait le texte de votre PDF puis le range dans des champs : nom, poste, entreprise, dates, compétences. Si la mise en page brouille cette extraction, votre candidature est écartée avant tout regard humain.",
      },
      { type: 'h2', text: 'Les règles qui comptent' },
      {
        type: 'ul',
        items: [
          'Du texte réel, jamais une image de texte ni un CV exporté en JPG.',
          'Des intitulés de sections standards : Expérience, Formation, Compétences.',
          'Un seul niveau de colonnes pour le contenu principal.',
          'Des dates au même format partout (2021 - 2024).',
          'Les mots-clés exacts de l’offre, écrits comme dans l’offre.',
        ],
      },
      { type: 'h2', text: 'Adapter son CV à chaque offre' },
      {
        type: 'p',
        text: "Reprenez le titre exact du poste dans votre bandeau, et faites remonter dans vos trois premières lignes les compétences citées dans l'annonce. C'est le geste qui change le plus les résultats, et il prend deux minutes.",
      },
      {
        type: 'p',
        text: "Sur IDJÔ CV, le modèle Plateau obtient le meilleur score de lisibilité automatique. Les autres modèles restent lisibles : la colonne latérale est traitée après le contenu principal.",
      },
    ],
  },
  {
    slug: 'lettre-de-motivation',
    title: 'Lettre de motivation : un modèle simple qui fonctionne',
    excerpt:
      'Trois paragraphes, une page, aucun cliché : la trame à reprendre pour vos candidatures.',
    readingTime: '5 min',
    updatedAt: '2026-02-20',
    category: 'Candidature',
    blocks: [
      {
        type: 'p',
        text: "La lettre ne répète pas le CV : elle explique pourquoi votre parcours rencontre ce poste, dans cette entreprise, maintenant.",
      },
      { type: 'h2', text: 'Paragraphe 1 — l’accroche' },
      {
        type: 'p',
        text: "Citez le poste et où vous l'avez vu, puis une phrase sur ce qui vous rend pertinent. Évitez « Je me permets de vous adresser ma candidature » : commencez par le fond.",
      },
      { type: 'h2', text: 'Paragraphe 2 — la preuve' },
      {
        type: 'p',
        text: "Deux réalisations concrètes et chiffrées, choisies parce qu'elles ressemblent à ce que le poste demande. Un chiffre vaut trois adjectifs.",
      },
      { type: 'h2', text: 'Paragraphe 3 — la projection' },
      {
        type: 'p',
        text: "Ce que vous comptez apporter dans les six premiers mois, puis une formule de disponibilité claire. Terminez par vos coordonnées, même si elles figurent déjà sur le CV.",
      },
    ],
  },
  {
    slug: 'premier-emploi',
    title: 'CV premier emploi : remplir une page sans expérience',
    excerpt:
      'Stages, projets académiques, bénévolat, compétences numériques : de quoi construire un CV solide en sortie d’école.',
    readingTime: '6 min',
    updatedAt: '2026-03-05',
    category: 'Débutants',
    blocks: [
      {
        type: 'p',
        text: "Sans expérience longue, l'ordre change : la formation passe en premier, et tout ce que vous avez réellement fait compte — y compris hors salariat.",
      },
      { type: 'h2', text: 'Ce qui compte comme expérience' },
      {
        type: 'ul',
        items: [
          'Stages et alternances, même courts, avec les missions décrites précisément.',
          'Projets de fin d’études : sujet, méthode, résultat, outils utilisés.',
          'Associations et bénévolat : responsabilité tenue, budget, nombre de personnes.',
          'Petits travaux et activités indépendantes : ils prouvent l’autonomie.',
          'Certifications en ligne, si elles sont récentes et liées au poste.',
        ],
      },
      { type: 'h2', text: 'Mettre en avant les compétences' },
      {
        type: 'p',
        text: "Distinguez les compétences techniques (outils, logiciels, langues) des compétences transversales, et illustrez chacune par un fait plutôt que par une note sur cinq.",
      },
      {
        type: 'quote',
        text: 'Un CV de débutant honnête et précis passe toujours devant un CV gonflé.',
      },
    ],
  },
]

export function getArticle(slug: string) {
  return ARTICLES.find((article) => article.slug === slug)
}
