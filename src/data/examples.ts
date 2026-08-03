import type { CvData, TemplateId } from '@/lib/types'
import { SAMPLE_CV } from '@/data/sample-cv'
import { TEMPLATE_BY_ID } from '@/data/templates'

/**
 * Exemples de CV par métier — pages de contenu destinées aux candidats qui
 * cherchent « exemple de CV comptable », « modèle CV développeur » etc.
 * Chaque exemple réutilise les modèles existants sans en modifier le dessin.
 */

export interface CvExample {
  slug: string
  job: string
  sector: string
  template: TemplateId
  summary: string
  /** Conseils spécifiques au métier. */
  advice: string[]
  keywords: string[]
  data: CvData
}

const base = SAMPLE_CV.settings

function build(partial: Partial<CvData> & { profile: CvData['profile'] }, template: TemplateId): CvData {
  return {
    profile: partial.profile,
    experiences: partial.experiences ?? [],
    educations: partial.educations ?? [],
    skills: partial.skills ?? [],
    languages: partial.languages ?? [
      { id: 'l1', name: 'Français', level: 100 },
      { id: 'l2', name: 'Anglais', level: 60 },
    ],
    awards: partial.awards ?? [],
    references: partial.references ?? [],
    hobbies: partial.hobbies ?? [],
    settings: {
      ...base,
      template,
      theme: TEMPLATE_BY_ID[template].defaultTheme,
      showPhoto: true,
    },
  }
}

export const EXAMPLES: CvExample[] = [
  {
    slug: 'comptable',
    job: 'Comptable',
    sector: 'Finance & gestion',
    template: 'lagune',
    summary:
      "Un CV de comptable doit prouver la rigueur avant tout : logiciels maîtrisés, volumes traités, respect des échéances fiscales et sociales.",
    advice: [
      'Citez vos logiciels par leur nom : Sage, Odoo, Excel avancé, Ciel.',
      'Chiffrez les volumes : nombre d’écritures, de factures, taille du portefeuille.',
      'Mentionnez le référentiel comptable utilisé (SYSCOHADA révisé).',
      'Indiquez votre connaissance des déclarations DGI et CNPS.',
    ],
    keywords: ['CV comptable', 'exemple CV comptabilité', 'SYSCOHADA', 'Sage'],
    data: build(
      {
        profile: {
          firstName: 'Kouamé',
          lastName: 'Brou',
          title: 'Comptable confirmé',
          about:
            "Comptable confirmé, 7 ans d'expérience en cabinet et en entreprise à Abidjan. Tenue complète de la comptabilité générale et analytique en référentiel SYSCOHADA révisé, préparation des états financiers et suivi des obligations fiscales et sociales.",
          phone: '+225 05 45 67 89 01',
          email: 'kouame.brou@email.ci',
          website: '',
          address: 'Marcory',
          city: 'Abidjan, Côte d’Ivoire',
        },
        experiences: [
          {
            id: 'e1',
            role: 'Comptable confirmé',
            company: 'Ivoire Distribution',
            location: 'Abidjan',
            start: '2021',
            end: '',
            current: true,
            description:
              "Tenue de la comptabilité générale de 3 sociétés du groupe, soit 1 800 écritures mensuelles.\nPréparation des états financiers annuels en SYSCOHADA révisé.\nSuivi des déclarations DGI et CNPS, zéro pénalité depuis 2021.\nRapprochements bancaires et suivi de trésorerie hebdomadaire.",
          },
          {
            id: 'e2',
            role: 'Assistant comptable',
            company: 'Cabinet Adjoumani & Associés',
            location: 'Abidjan',
            start: '2018',
            end: '2021',
            current: false,
            description:
              "Traitement comptable d'un portefeuille de 15 PME.\nSaisie et lettrage sur Sage 100 et Odoo.\nPréparation des liasses fiscales et assistance aux missions d'audit.",
          },
        ],
        educations: [
          {
            id: 'f1',
            degree: 'Master Comptabilité, Contrôle, Audit',
            school: 'Université Félix Houphouët-Boigny',
            location: 'Abidjan',
            start: '2016',
            end: '2018',
            description: '',
          },
          {
            id: 'f2',
            degree: 'BTS Finance Comptabilité',
            school: 'INP-HB',
            location: 'Yamoussoukro',
            start: '2014',
            end: '2016',
            description: '',
          },
        ],
        skills: [
          { id: 's1', name: 'SYSCOHADA révisé', level: 95 },
          { id: 's2', name: 'Sage 100', level: 90 },
          { id: 's3', name: 'Odoo', level: 75 },
          { id: 's4', name: 'Excel avancé', level: 85 },
          { id: 's5', name: 'Fiscalité DGI', level: 80 },
        ],
        awards: [],
        references: [
          {
            id: 'r1',
            name: 'Marc Adjoumani',
            role: 'Expert-comptable',
            company: 'Cabinet Adjoumani & Associés',
            contact: 'm.adjoumani@cabinet.ci',
          },
        ],
      },
      'lagune',
    ),
  },
  {
    slug: 'developpeur-web',
    job: 'Développeur web',
    sector: 'Numérique',
    template: 'plateau',
    summary:
      "Pour un poste de développeur, le recruteur cherche la pile technique, les projets livrés et le lien vers le code. Tout le reste passe après.",
    advice: [
      'Placez la pile technique juste après l’accroche : elle est scannée en premier.',
      'Donnez le lien de votre GitHub ou de votre portfolio dans les coordonnées.',
      'Décrivez chaque projet par le problème résolu, pas seulement l’outil utilisé.',
      'Précisez le contexte : équipe, durée, nombre d’utilisateurs.',
    ],
    keywords: ['CV développeur', 'exemple CV informatique', 'CV développeur web Abidjan'],
    data: build(
      {
        profile: {
          firstName: 'Yasmine',
          lastName: 'Traoré',
          title: 'Développeuse web full stack',
          about:
            "Développeuse full stack, 5 ans d'expérience sur des applications web à fort trafic en Afrique de l'Ouest. Spécialisée React, Node.js et PostgreSQL, avec une attention particulière aux performances sur connexions mobiles limitées.",
          phone: '+225 01 23 45 67 89',
          email: 'yasmine.traore@email.ci',
          website: 'github.com/ytraore',
          address: 'Riviera',
          city: 'Abidjan, Côte d’Ivoire',
        },
        experiences: [
          {
            id: 'e1',
            role: 'Développeuse full stack',
            company: 'PayLink Afrique',
            location: 'Abidjan',
            start: '2022',
            end: '',
            current: true,
            description:
              "Développement de l'application de paiement marchand utilisée par 40 000 commerçants.\nRéduction du temps de chargement de 4,2 s à 1,1 s sur réseau 3G.\nIntégration des API Orange Money, MTN MoMo et Wave.\nEncadrement de deux développeurs juniors.",
          },
          {
            id: 'e2',
            role: 'Développeuse front-end',
            company: 'Agence Kodo',
            location: 'Abidjan',
            start: '2020',
            end: '2022',
            current: false,
            description:
              "Réalisation de 14 sites clients en React et Next.js.\nMise en place des bonnes pratiques d'accessibilité et de SEO technique.",
          },
        ],
        educations: [
          {
            id: 'f1',
            degree: 'Ingénieur en informatique',
            school: 'ESATIC',
            location: 'Abidjan',
            start: '2015',
            end: '2020',
            description: 'Spécialisation génie logiciel.',
          },
        ],
        skills: [
          { id: 's1', name: 'React / Next.js', level: 92 },
          { id: 's2', name: 'Node.js', level: 88 },
          { id: 's3', name: 'PostgreSQL', level: 80 },
          { id: 's4', name: 'TypeScript', level: 85 },
          { id: 's5', name: 'Docker & CI/CD', level: 70 },
        ],
      },
      'plateau',
    ),
  },
  {
    slug: 'commercial',
    job: 'Commercial terrain',
    sector: 'Vente & distribution',
    template: 'abidjan',
    summary:
      "Un CV commercial se juge sur les chiffres : objectifs atteints, portefeuille développé, zones couvertes. Sans résultats chiffrés, la candidature ne convainc pas.",
    advice: [
      'Indiquez systématiquement le taux de réalisation de vos objectifs.',
      'Précisez la zone géographique couverte et le type de clientèle.',
      'Mentionnez votre permis de conduire et votre mobilité.',
      'Citez le CRM utilisé si vous en avez pratiqué un.',
    ],
    keywords: ['CV commercial', 'exemple CV vendeur', 'CV représentant Abidjan'],
    data: build(
      {
        profile: {
          firstName: 'Ibrahim',
          lastName: 'Sangaré',
          title: 'Commercial terrain — Grande distribution',
          about:
            "Commercial terrain, 6 ans d'expérience dans la distribution de produits de grande consommation à Abidjan et à l'intérieur du pays. Développement de portefeuille, animation de points de vente et recouvrement.",
          phone: '+225 07 88 99 00 11',
          email: 'ibrahim.sangare@email.ci',
          website: '',
          address: 'Yopougon',
          city: 'Abidjan, Côte d’Ivoire',
        },
        experiences: [
          {
            id: 'e1',
            role: 'Commercial terrain senior',
            company: 'Distri-Ouest',
            location: 'Abidjan & Bouaké',
            start: '2021',
            end: '',
            current: true,
            description:
              "Gestion d'un portefeuille de 180 points de vente sur 4 communes.\nRéalisation de 112 % des objectifs annuels en 2024.\nOuverture de 46 nouveaux comptes en deux ans.\nRecouvrement : encours ramené de 45 à 18 jours.",
          },
          {
            id: 'e2',
            role: 'Vendeur en boutique',
            company: 'Sococé Distribution',
            location: 'Abidjan',
            start: '2019',
            end: '2021',
            current: false,
            description:
              "Conseil client et tenue de caisse.\nMise en rayon et gestion des stocks du rayon alimentaire.",
          },
        ],
        educations: [
          {
            id: 'f1',
            degree: 'BTS Force de vente',
            school: 'Groupe Loko',
            location: 'Abidjan',
            start: '2017',
            end: '2019',
            description: '',
          },
          {
            id: 'f2',
            degree: 'Baccalauréat série G2',
            school: 'Lycée Moderne de Yopougon',
            location: 'Abidjan',
            start: '2016',
            end: '2017',
            description: '',
          },
        ],
        skills: [
          { id: 's1', name: 'Prospection terrain', level: 92 },
          { id: 's2', name: 'Négociation', level: 88 },
          { id: 's3', name: 'Recouvrement', level: 80 },
          { id: 's4', name: 'CRM Odoo', level: 65 },
          { id: 's5', name: 'Permis B — véhiculé', level: 100 },
        ],
        languages: [
          { id: 'l1', name: 'Français', level: 100 },
          { id: 'l2', name: 'Dioula', level: 95 },
          { id: 'l3', name: 'Baoulé', level: 70 },
          { id: 'l4', name: 'Anglais', level: 40 },
        ],
        awards: [
          {
            id: 'a1',
            title: 'Meilleur commercial de la région',
            organization: 'Distri-Ouest',
            period: '2023',
            description: '',
          },
        ],
      },
      'abidjan',
    ),
  },
  {
    slug: 'assistante-de-direction',
    job: 'Assistante de direction',
    sector: 'Administration',
    template: 'cocody',
    summary:
      "Le poste exige discrétion, organisation et maîtrise des outils. Le CV doit montrer le niveau de responsabilité confié et les interlocuteurs gérés.",
    advice: [
      'Précisez le niveau du dirigeant assisté : DG, DAF, directeur régional.',
      'Détaillez les tâches réellement déléguées : agenda, déplacements, comptes rendus.',
      'Mentionnez votre vitesse de frappe et votre maîtrise du pack Office.',
      'Valorisez la confidentialité, très regardée sur ce poste.',
    ],
    keywords: ['CV assistante de direction', 'exemple CV secrétaire', 'CV administratif'],
    data: build(
      {
        profile: {
          firstName: 'Adjoua',
          lastName: 'Kouassi',
          title: 'Assistante de direction bilingue',
          about:
            "Assistante de direction, 9 ans auprès de directions générales à Abidjan. Gestion d'agendas complexes, organisation de déplacements internationaux, préparation des conseils et suivi administratif, en français et en anglais.",
          phone: '+225 05 11 22 33 44',
          email: 'adjoua.kouassi@email.ci',
          website: '',
          address: 'Deux-Plateaux',
          city: 'Abidjan, Côte d’Ivoire',
        },
        experiences: [
          {
            id: 'e1',
            role: 'Assistante de direction générale',
            company: 'Groupe Atlantique',
            location: 'Abidjan',
            start: '2019',
            end: '',
            current: true,
            description:
              "Assistanat du Directeur Général et de deux directeurs de département.\nOrganisation de 30 déplacements internationaux par an.\nPréparation et compte rendu des comités de direction hebdomadaires.\nGestion du budget de fonctionnement du service, 25 M FCFA.",
          },
          {
            id: 'e2',
            role: 'Secrétaire de direction',
            company: 'Clinique Sainte-Anne',
            location: 'Abidjan',
            start: '2016',
            end: '2019',
            current: false,
            description:
              "Accueil, gestion du standard et des courriers.\nSuivi des dossiers du personnel et des plannings.",
          },
        ],
        educations: [
          {
            id: 'f1',
            degree: 'Licence en Assistanat de direction',
            school: 'Groupe CSI Pôle Polytechnique',
            location: 'Abidjan',
            start: '2013',
            end: '2016',
            description: '',
          },
        ],
        skills: [
          { id: 's1', name: 'Gestion d’agenda', level: 95 },
          { id: 's2', name: 'Pack Office', level: 90 },
          { id: 's3', name: 'Rédaction administrative', level: 88 },
          { id: 's4', name: 'Organisation d’événements', level: 78 },
          { id: 's5', name: 'Confidentialité', level: 100 },
        ],
        languages: [
          { id: 'l1', name: 'Français', level: 100 },
          { id: 'l2', name: 'Anglais', level: 85 },
        ],
        hobbies: ['Lecture', 'Chorale', 'Marche'],
      },
      'cocody',
    ),
  },
  {
    slug: 'technicien-de-maintenance',
    job: 'Technicien de maintenance',
    sector: 'Industrie & technique',
    template: 'abidjan',
    summary:
      "Sur les postes techniques, les habilitations et les équipements maîtrisés comptent autant que l'expérience. Ils doivent être visibles immédiatement.",
    advice: [
      'Listez les équipements et marques sur lesquels vous êtes intervenu.',
      'Indiquez vos habilitations (électrique, travail en hauteur, HACCP).',
      'Chiffrez la disponibilité machine ou le temps d’intervention moyen.',
      'Mentionnez le travail posté si vous l’avez pratiqué.',
    ],
    keywords: ['CV technicien maintenance', 'exemple CV industrie', 'CV électromécanicien'],
    data: build(
      {
        profile: {
          firstName: 'Séka',
          lastName: 'Djédjé',
          title: 'Technicien de maintenance industrielle',
          about:
            "Technicien de maintenance, 8 ans en agroalimentaire et en industrie plastique. Maintenance préventive et curative des lignes de production, diagnostic électromécanique et suivi des pièces de rechange.",
          phone: '+225 07 34 56 78 90',
          email: 'seka.djedje@email.ci',
          website: '',
          address: 'Vridi',
          city: 'Abidjan, Côte d’Ivoire',
        },
        experiences: [
          {
            id: 'e1',
            role: 'Technicien de maintenance',
            company: 'Ivoire Agro Industrie',
            location: 'Abidjan',
            start: '2020',
            end: '',
            current: true,
            description:
              "Maintenance de 6 lignes de conditionnement en travail posté 3×8.\nDisponibilité machine portée de 87 % à 96 % en deux ans.\nDiagnostic électrique, pneumatique et mécanique.\nGestion du magasin de pièces détachées, 400 références.",
          },
          {
            id: 'e2',
            role: 'Électromécanicien',
            company: 'Plastica CI',
            location: 'Abidjan',
            start: '2017',
            end: '2020',
            current: false,
            description:
              "Interventions curatives sur presses à injecter.\nMise en place du plan de maintenance préventive.",
          },
        ],
        educations: [
          {
            id: 'f1',
            degree: 'BTS Électromécanique',
            school: 'INP-HB',
            location: 'Yamoussoukro',
            start: '2014',
            end: '2017',
            description: '',
          },
        ],
        skills: [
          { id: 's1', name: 'Diagnostic électromécanique', level: 92 },
          { id: 's2', name: 'Automates Siemens', level: 75 },
          { id: 's3', name: 'Pneumatique / hydraulique', level: 85 },
          { id: 's4', name: 'GMAO', level: 70 },
          { id: 's5', name: 'Habilitation électrique B2V', level: 100 },
        ],
      },
      'abidjan',
    ),
  },
  {
    slug: 'infirmier',
    job: 'Infirmier',
    sector: 'Santé',
    template: 'lagune',
    summary:
      "Le CV soignant doit afficher le diplôme d'État, le numéro d'inscription à l'ordre et les services fréquentés. Le reste vient ensuite.",
    advice: [
      'Faites figurer le diplôme d’État et l’inscription à l’ordre dès l’en-tête.',
      'Détaillez les services : urgences, pédiatrie, bloc, dispensaire rural.',
      'Indiquez le nombre de lits ou de patients pris en charge.',
      'Citez vos formations continues récentes.',
    ],
    keywords: ['CV infirmier', 'exemple CV santé', 'CV infirmier diplômé d’État'],
    data: build(
      {
        profile: {
          firstName: 'Awa',
          lastName: 'Camara',
          title: 'Infirmière diplômée d’État',
          about:
            "Infirmière diplômée d'État, 6 ans d'exercice en milieu hospitalier et en dispensaire. Expérience des urgences et de la prise en charge maternelle et infantile, avec une pratique quotidienne de l'éducation thérapeutique.",
          phone: '+225 01 45 67 89 12',
          email: 'awa.camara@email.ci',
          website: '',
          address: 'Treichville',
          city: 'Abidjan, Côte d’Ivoire',
        },
        experiences: [
          {
            id: 'e1',
            role: 'Infirmière — service des urgences',
            company: 'CHU de Treichville',
            location: 'Abidjan',
            start: '2021',
            end: '',
            current: true,
            description:
              "Prise en charge de 40 à 60 patients par garde.\nTriage, pose de perfusions, surveillance des constantes.\nParticipation à la formation des étudiants en soins infirmiers.",
          },
          {
            id: 'e2',
            role: 'Infirmière polyvalente',
            company: 'Centre de santé rural de Toumodi',
            location: 'Toumodi',
            start: '2019',
            end: '2021',
            current: false,
            description:
              "Consultations, vaccinations et suivi des grossesses.\nCampagnes de sensibilisation au paludisme dans 8 villages.",
          },
        ],
        educations: [
          {
            id: 'f1',
            degree: 'Diplôme d’État d’Infirmier',
            school: 'INFAS',
            location: 'Abidjan',
            start: '2016',
            end: '2019',
            description: 'Inscrite à l’Ordre National des Infirmiers de Côte d’Ivoire.',
          },
        ],
        skills: [
          { id: 's1', name: 'Soins d’urgence', level: 92 },
          { id: 's2', name: 'Santé maternelle et infantile', level: 85 },
          { id: 's3', name: 'Éducation thérapeutique', level: 80 },
          { id: 's4', name: 'Gestion de la pharmacie de service', level: 70 },
        ],
        languages: [
          { id: 'l1', name: 'Français', level: 100 },
          { id: 'l2', name: 'Malinké', level: 90 },
          { id: 'l3', name: 'Anglais', level: 45 },
        ],
      },
      'lagune',
    ),
  },
]

export function getExample(slug: string) {
  return EXAMPLES.find((example) => example.slug === slug)
}
