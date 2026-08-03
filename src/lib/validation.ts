import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(120),
  email: z.string().trim().email('Email invalide').max(200),
  subject: z.string().trim().min(2, 'Sujet trop court').max(200),
  message: z.string().trim().min(10, 'Message trop court').max(4000),
})

const experienceSchema = z.object({
  id: z.string(),
  role: z.string().max(160),
  company: z.string().max(160),
  location: z.string().max(160),
  start: z.string().max(40),
  end: z.string().max(40),
  current: z.boolean(),
  description: z.string().max(3000),
})

const educationSchema = z.object({
  id: z.string(),
  degree: z.string().max(160),
  school: z.string().max(160),
  location: z.string().max(160),
  start: z.string().max(40),
  end: z.string().max(40),
  description: z.string().max(2000),
})

const levelSchema = z.object({
  id: z.string(),
  name: z.string().max(120),
  level: z.number().min(0).max(100),
})

export const cvSchema = z.object({
  profile: z.object({
    firstName: z.string().max(120),
    lastName: z.string().max(120),
    title: z.string().max(160),
    photo: z.string().max(2_000_000).optional(),
    about: z.string().max(3000),
    phone: z.string().max(60),
    email: z.string().max(200),
    website: z.string().max(200),
    address: z.string().max(200),
    city: z.string().max(160),
  }),
  experiences: z.array(experienceSchema).max(30),
  educations: z.array(educationSchema).max(30),
  skills: z.array(levelSchema).max(40),
  languages: z.array(levelSchema).max(20),
  awards: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().max(160),
        organization: z.string().max(160),
        period: z.string().max(60),
        description: z.string().max(1500),
      }),
    )
    .max(20),
  references: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().max(160),
        role: z.string().max(160),
        company: z.string().max(160),
        contact: z.string().max(200),
      }),
    )
    .max(20),
  hobbies: z.array(z.string().max(80)).max(20),
  settings: z.object({
    template: z.enum([
      'abidjan',
      'plateau',
      'lagune',
      'cocody',
      'marcory',
      'treichville',
      'bassam',
      'yamoussoukro',
    ]),
    // Palette, dose de couleur et typographie sont facultatives pour rester
    // compatibles avec les CV enregistrés avant leur arrivée ; sans elles, le
    // document reprendrait l'habillage par défaut à la relecture.
    theme: z.string().max(40).default('nuit'),
    accent: z.string().max(20),
    intensity: z
      .enum(['filet', 'sobre', 'doux', 'colore', 'soutenu', 'intense', 'profond'])
      .default('colore'),
    fontFamily: z
      .enum([
        'sans',
        'serif',
        'condense',
        'grotesk',
        'geometrique',
        'humaniste',
        'technique',
        'editorial',
        'elegant',
      ])
      .default('sans'),
    fontScale: z.number().min(0.8).max(1.3),
    showPhoto: z.boolean(),
  }),
})

export const saveCvSchema = z.object({
  title: z.string().trim().min(1).max(160).default('Mon CV'),
  ownerEmail: z.string().trim().email().optional(),
  data: cvSchema,
})
