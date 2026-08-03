import type { CvData } from '@/lib/types'

/**
 * CV de démonstration : sert d'aperçu sur la page d'accueil, dans la galerie
 * de modèles et de point de départ pour l'éditeur.
 */
export const SAMPLE_CV: CvData = {
  profile: {
    firstName: 'Aïcha',
    lastName: 'Konaté',
    title: 'Responsable Marketing Digital',
    about:
      "Responsable marketing digital avec 8 ans d'expérience à Abidjan, spécialisée dans l'acquisition, le contenu et la performance des campagnes en Afrique de l'Ouest. J'accompagne les marques dans leur passage à l'échelle sur les canaux digitaux et mobile money.",
    phone: '+225 07 07 12 34 56',
    email: 'aicha.konate@email.ci',
    website: 'aichakonate.ci',
    address: 'Rue des Jardins, Cocody',
    city: 'Abidjan, Côte d’Ivoire',
  },
  experiences: [
    {
      id: 'exp_1',
      role: 'Responsable Marketing Digital',
      company: 'Ivoire Telecom',
      location: 'Abidjan',
      start: '2021',
      end: '',
      current: true,
      description:
        "Pilotage d'un budget annuel de 120 M FCFA et d'une équipe de 6 personnes.\nCroissance de 42 % des inscriptions à l'offre mobile en 18 mois.\nMise en place du tracking et des tableaux de bord d'acquisition.",
    },
    {
      id: 'exp_2',
      role: 'Chargée de Communication',
      company: 'Agence Baobab',
      location: 'Abidjan',
      start: '2018',
      end: '2021',
      current: false,
      description:
        "Gestion de 12 comptes clients (banque, agroalimentaire, ONG).\nProduction de contenus et animation des réseaux sociaux.\nOrganisation de 20+ activations terrain à Abidjan et Bouaké.",
    },
    {
      id: 'exp_3',
      role: 'Assistante Marketing',
      company: 'Groupe Kacou',
      location: 'Yamoussoukro',
      start: '2016',
      end: '2018',
      current: false,
      description:
        "Études de marché et veille concurrentielle.\nSuivi des opérations de promotion en points de vente.",
    },
  ],
  educations: [
    {
      id: 'edu_1',
      degree: 'Master Marketing & Stratégie',
      school: 'INP-HB',
      location: 'Yamoussoukro',
      start: '2014',
      end: '2016',
      description: 'Spécialisation marketing digital et études quantitatives.',
    },
    {
      id: 'edu_2',
      degree: 'Licence Sciences de Gestion',
      school: 'Université Félix Houphouët-Boigny',
      location: 'Abidjan',
      start: '2011',
      end: '2014',
      description: 'Mention Bien. Major de promotion en marketing.',
    },
    {
      id: 'edu_3',
      degree: 'Baccalauréat série B',
      school: 'Lycée Sainte-Marie',
      location: 'Abidjan',
      start: '2010',
      end: '2011',
      description: '',
    },
  ],
  skills: [
    { id: 'sk_1', name: 'Stratégie digitale', level: 92 },
    { id: 'sk_2', name: 'Google Ads & Meta Ads', level: 88 },
    { id: 'sk_3', name: 'Analytics & data', level: 80 },
    { id: 'sk_4', name: 'Content & copywriting', level: 85 },
    { id: 'sk_5', name: 'Gestion d’équipe', level: 78 },
  ],
  languages: [
    { id: 'lg_1', name: 'Français', level: 100 },
    { id: 'lg_2', name: 'Anglais', level: 75 },
    { id: 'lg_3', name: 'Dioula', level: 90 },
    { id: 'lg_4', name: 'Baoulé', level: 60 },
  ],
  awards: [
    {
      id: 'aw_1',
      title: 'Campagne de l’année',
      organization: 'Ivoire Digital Awards',
      period: '2023',
      description: 'Campagne « Tous connectés » — 3,2 M de personnes touchées.',
    },
    {
      id: 'aw_2',
      title: 'Meilleure collaboratrice',
      organization: 'Agence Baobab',
      period: '2020',
      description: 'Distinction interne pour la performance des comptes gérés.',
    },
  ],
  references: [
    {
      id: 'rf_1',
      name: 'Koffi N’Guessan',
      role: 'Directeur Marketing',
      company: 'Ivoire Telecom',
      contact: '+225 01 02 03 04 05',
    },
    {
      id: 'rf_2',
      name: 'Fatoumata Diarra',
      role: 'Directrice Conseil',
      company: 'Agence Baobab',
      contact: 'f.diarra@baobab.ci',
    },
    {
      id: 'rf_3',
      name: 'Serge Aka',
      role: 'Enseignant-chercheur',
      company: 'INP-HB',
      contact: 's.aka@inphb.ci',
    },
  ],
  hobbies: ['Lecture', 'Course à pied', 'Photographie', 'Bénévolat', 'Voyages'],
  settings: {
    template: 'abidjan',
    theme: 'brique',
    accent: '#9C3B26',
    intensity: 'colore',
    fontFamily: 'sans',
    fontScale: 1,
    showPhoto: true,
  },
}

/** CV vierge proposé au démarrage de l'éditeur. */
export const EMPTY_CV: CvData = {
  profile: {
    firstName: '',
    lastName: '',
    title: '',
    about: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
  },
  experiences: [],
  educations: [],
  skills: [],
  languages: [],
  awards: [],
  references: [],
  hobbies: [],
  settings: {
    template: 'abidjan',
    theme: 'nuit',
    accent: '#17284D',
    intensity: 'colore',
    fontFamily: 'sans',
    fontScale: 1,
    showPhoto: true,
  },
}
