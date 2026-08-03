import type { ReactNode } from 'react'
import { Bar, Description, Icon, Photo, TemplateProps, svgIcon } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { periodLabel } from '@/lib/utils'

/**
 * Modèle « Yamoussoukro » — feuille encadrée d'un liseré sombre, en-tête à
 * photo ronde et panneau de contact en quatre cases, puis des cartes coiffées
 * d'un titre en gélule (profil, formation, références, expérience,
 * compétences).
 */
export function TemplateYamoussoukro({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const accent = theme.accent
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  const pill = theme.filled ? theme.band : '#4A4A4A'
  const pillInk = theme.filled ? theme.onBand : '#FFFFFF'
  const card = theme.panel

  const title = (label: string, path: string) => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        background: pill,
        color: pillInk,
        borderRadius: 999,
        padding: '7px 22px',
        marginBottom: -14,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Icon path={path} size={13} color={pillInk} />
      <span
        style={{
          fontSize: fs(12.5),
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label} :
      </span>
    </div>
  )

  const panel = (children: ReactNode) => (
    <div
      style={{
        background: card,
        borderRadius: 16,
        padding: '26px 20px 18px',
      }}
    >
      {children}
    </div>
  )

  const section = (label: string, path: string, children: ReactNode) => (
    <section className="cv-block" style={{ marginBottom: 18 }}>
      <div style={{ textAlign: 'center' }}>{title(label, path)}</div>
      {panel(children)}
    </section>
  )

  const icons = {
    profil: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    formation: 'M22 10 12 5 2 10l10 5 10-5Z M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
    reference: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    experience: 'M4 7h16v13H4z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
    competences: 'M4 6h16 M4 12h10 M4 18h13',
  }

  return (
    <div
      style={{
        border: '10px solid #2A2A2A',
        minHeight: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        fontSize: fs(10),
        color: '#3A3A3A',
        lineHeight: 1.5,
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          margin: 10,
          borderRadius: 18,
          overflow: 'hidden',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* En-tête */}
        <header
          style={{
            background: theme.panelSoft,
            padding: '26px 26px 30px',
            display: 'flex',
            alignItems: 'center',
            gap: 26,
          }}
        >
          {settings.showPhoto ? (
            <Photo
              src={profile.photo}
              firstName={profile.firstName}
              lastName={profile.lastName}
              size={172}
              accent={accent}
              tone="#FFFFFF"
              style={{ border: '5px solid #FFFFFF', flexShrink: 0 }}
            />
          ) : null}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: fs(34),
                fontWeight: 800,
                letterSpacing: '0.01em',
                textTransform: 'uppercase',
                color: '#1E1E1E',
                lineHeight: 1.05,
              }}
            >
              {profile.firstName}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: fs(30),
                fontWeight: 500,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                color: accent,
                lineHeight: 1.1,
              }}
            >
              {profile.lastName}
            </p>
            <p
              style={{
                margin: '2px 0 10px',
                fontSize: fs(12),
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#5A5A5A',
              }}
            >
              {profile.title}
            </p>
            <span
              style={{ display: 'block', width: 150, height: 3, background: accent }}
              aria-hidden
            />

            <div
              style={{
                marginTop: 16,
                background: theme.filled ? theme.band : '#4A4A4A',
                color: theme.filled ? theme.onBand : '#FFFFFF',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 18px',
              }}
            >
              {[
                { label: 'Téléphone :', value: profile.phone, icon: svgIcon.phone },
                {
                  label: 'Adresse :',
                  value: [profile.address, profile.city].filter(Boolean).join(', '),
                  icon: svgIcon.pin,
                },
                { label: 'E-mail :', value: profile.email, icon: svgIcon.mail },
                { label: 'Site :', value: profile.website, icon: svgIcon.globe },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Icon
                      path={item.icon}
                      size={14}
                      color={theme.filled ? theme.onBand : '#FFFFFF'}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: fs(8.6), fontStyle: 'italic', opacity: 0.9 }}>
                        {item.label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: fs(9.4),
                          fontWeight: 700,
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </header>

        {/* Cartes */}
        <div style={{ display: 'flex', gap: 16, padding: '24px 16px 20px', flex: 1 }}>
          <div style={{ flex: '1 1 50%' }}>
            {profile.about
              ? section(
                  'Profil',
                  icons.profil,
                  <Description
                    text={profile.about}
                    style={{ fontSize: fs(9.8), textAlign: 'justify' }}
                  />,
                )
              : null}

            {data.references.length
              ? section(
                  'Référence',
                  icons.reference,
                  <>
                    {data.references.map((ref) => (
                      <div
                        key={ref.id}
                        className="cv-block"
                        style={{ textAlign: 'center', marginBottom: 12 }}
                      >
                        <strong
                          style={{
                            fontSize: fs(11),
                            textTransform: 'uppercase',
                            color: '#1E1E1E',
                          }}
                        >
                          {ref.name}
                        </strong>
                        <p style={{ margin: '2px 0 0', fontSize: fs(9.4), fontStyle: 'italic' }}>
                          {[ref.role, ref.company].filter(Boolean).join(', ')}
                        </p>
                        <p style={{ margin: 0, fontSize: fs(9.4), fontStyle: 'italic' }}>
                          {ref.contact}
                        </p>
                      </div>
                    ))}
                  </>,
                )
              : null}

            {data.skills.length
              ? section(
                  'Compétences',
                  icons.competences,
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      columnGap: 16,
                      rowGap: 10,
                    }}
                  >
                    {data.skills.map((skill) => (
                      <div key={skill.id}>
                        <p
                          style={{
                            margin: '0 0 3px',
                            fontSize: fs(9),
                            fontStyle: 'italic',
                            fontWeight: 600,
                            color: '#2E2E2E',
                          }}
                        >
                          {skill.name}
                        </p>
                        <Bar value={skill.level} accent={accent} height={4} track="#D8DEE4" />
                      </div>
                    ))}
                  </div>,
                )
              : null}

            {data.hobbies.length
              ? section(
                  'Centres d’intérêt',
                  icons.profil,
                  <p style={{ margin: 0, fontSize: fs(9.6), textAlign: 'center' }}>
                    {data.hobbies.join(' · ')}
                  </p>,
                )
              : null}
          </div>

          <div style={{ flex: '1 1 50%' }}>
            {data.educations.length
              ? section(
                  'Formation',
                  icons.formation,
                  <>
                    {data.educations.map((edu) => (
                      <div
                        key={edu.id}
                        className="cv-block"
                        style={{ textAlign: 'center', marginBottom: 12 }}
                      >
                        <strong
                          style={{
                            fontSize: fs(11),
                            textTransform: 'uppercase',
                            color: '#1E1E1E',
                          }}
                        >
                          {edu.school}
                        </strong>
                        <p style={{ margin: '1px 0 2px', fontSize: fs(9.4) }}>
                          <span style={{ fontStyle: 'italic' }}>{edu.degree}</span>{' '}
                          <span style={{ fontWeight: 700, color: accent }}>
                            {periodLabel(edu.start, edu.end)}
                          </span>
                        </p>
                        <Description text={edu.description} style={{ fontSize: fs(9.4) }} />
                      </div>
                    ))}
                  </>,
                )
              : null}

            {data.experiences.length
              ? section(
                  'Expérience',
                  icons.experience,
                  <>
                    {data.experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="cv-block"
                        style={{ textAlign: 'center', marginBottom: 14 }}
                      >
                        <strong
                          style={{
                            fontSize: fs(11),
                            textTransform: 'uppercase',
                            color: '#1E1E1E',
                          }}
                        >
                          {exp.role}
                        </strong>
                        <p style={{ margin: '1px 0 3px', fontSize: fs(9.4) }}>
                          <span style={{ fontStyle: 'italic' }}>
                            {[exp.company, exp.location].filter(Boolean).join(' / ')}
                          </span>{' '}
                          <span style={{ fontWeight: 700, color: accent }}>
                            {periodLabel(exp.start, exp.end, exp.current)}
                          </span>
                        </p>
                        <Description
                          text={exp.description}
                          style={{ fontSize: fs(9.4), textAlign: 'justify' }}
                        />
                      </div>
                    ))}
                  </>,
                )
              : null}

            {data.languages.length
              ? section(
                  'Langues',
                  icons.competences,
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      columnGap: 16,
                      rowGap: 10,
                    }}
                  >
                    {data.languages.map((lang) => (
                      <div key={lang.id}>
                        <p
                          style={{
                            margin: '0 0 3px',
                            fontSize: fs(9),
                            fontStyle: 'italic',
                            fontWeight: 600,
                            color: '#2E2E2E',
                          }}
                        >
                          {lang.name}
                        </p>
                        <Bar value={lang.level} accent={accent} height={4} track="#D8DEE4" />
                      </div>
                    ))}
                  </div>,
                )
              : null}
          </div>
        </div>
      </div>
    </div>
  )
}
