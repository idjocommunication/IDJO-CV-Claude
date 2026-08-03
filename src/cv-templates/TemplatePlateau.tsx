import { Description, Dots, Photo, TemplateProps } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { periodLabel } from '@/lib/utils'

/**
 * Modèle « Plateau » — minimaliste : photo ronde, nom en très grand,
 * colonne gauche (formation / contact) alignée à droite, colonne principale
 * (profil / expérience / compétences).
 */
export function TemplatePlateau({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const accent = theme.accent
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  const heading = (label: string) => (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          margin: 0,
          fontSize: fs(15),
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: theme.filled ? theme.deep : '#0A0A0A',
        }}
      >
        {label}
      </p>
      <span
        style={{ display: 'block', width: 34, height: 4, background: accent, marginTop: 10 }}
      />
    </div>
  )

  return (
    <div
      style={{
        fontSize: fs(10),
        color: '#2B2B2B',
        lineHeight: 1.6,
        padding: '0 0 54px',
        position: 'relative',
        background: theme.bold ? theme.panel : '#FFFFFF',
      }}
    >
      {/* Repères verticaux haut / bas */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 10,
          height: 34,
          background: accent,
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          width: 10,
          height: 34,
          background: accent,
        }}
      />

      {/* En-tête */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 34,
          padding: '86px 56px 54px',
        }}
      >
        {settings.showPhoto ? (
          <Photo
            src={profile.photo}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size={132}
            accent={accent}
            tone={theme.panelSoft}
            style={{ boxShadow: `0 0 0 4px ${theme.panel}` }}
          />
        ) : null}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: fs(44),
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              color: '#1B1B1B',
            }}
          >
            {profile.firstName}
            <br />
            {profile.lastName}
          </p>
          <p
            style={{
              display: 'inline-block',
              margin: '14px 0 0',
              background: accent,
              color: '#FFFFFF',
              padding: '5px 14px',
              fontSize: fs(13),
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {profile.title}
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 40, padding: '0 56px' }}>
        {/* Colonne gauche */}
        <div style={{ flex: '0 0 34%', textAlign: 'right' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {heading('Formation')}
          </div>
          {data.educations.map((edu) => (
            <div key={edu.id} className="cv-block" style={{ marginBottom: 22 }}>
              <p style={{ margin: 0, fontSize: fs(10.5), color: '#6B6B6B' }}>
                {periodLabel(edu.start, edu.end)}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: fs(11), fontWeight: 700, color: '#1B1B1B' }}>
                {edu.degree}
              </p>
              <p style={{ margin: 0, fontSize: fs(10.5) }}>{edu.school}</p>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              marginTop: 42,
            }}
          >
            {heading('Contact')}
          </div>
          {[
            { label: 'Téléphone', value: profile.phone },
            { label: 'Email', value: profile.email },
            { label: 'Site', value: profile.website },
            {
              label: 'Adresse',
              value: [profile.address, profile.city].filter(Boolean).join(', '),
            },
          ]
            .filter((i) => i.value)
            .map((item) => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: fs(11), fontWeight: 700, color: '#1B1B1B' }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, fontSize: fs(10.5) }}>{item.value}</p>
              </div>
            ))}
        </div>

        {/* Colonne principale */}
        <div style={{ flex: 1 }}>
          {heading('Profil')}
          <Description text={profile.about} style={{ fontSize: fs(10.5), marginBottom: 38 }} />

          {heading('Expérience')}
          {data.experiences.map((exp) => (
            <div key={exp.id} className="cv-block" style={{ display: 'flex', gap: 20, marginBottom: 22 }}>
              <div style={{ flex: '0 0 22%' }}>
                <p style={{ margin: 0, fontSize: fs(10), color: '#6B6B6B' }}>
                  {periodLabel(exp.start, exp.end, exp.current)}
                </p>
                <p style={{ margin: 0, fontSize: fs(10), color: '#6B6B6B' }}>{exp.company}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: fs(11.5), fontWeight: 700, color: '#1B1B1B' }}>
                  {exp.role}
                </p>
                <Description
                  text={exp.description}
                  style={{ fontSize: fs(10.2), marginTop: 3 }}
                />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 34 }}>{heading('Compétences')}</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 30,
              rowGap: 12,
            }}
          >
            {data.skills.map((skill) => (
              <div
                key={skill.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              >
                <span style={{ fontSize: fs(10.5), fontWeight: 600, color: '#1B1B1B' }}>
                  {skill.name}
                </span>
                <Dots value={skill.level} accent={accent} />
              </div>
            ))}
          </div>

          {data.languages.length ? (
            <>
              <div style={{ marginTop: 34 }}>{heading('Langues')}</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 30,
                  rowGap: 12,
                }}
              >
                {data.languages.map((lang) => (
                  <div
                    key={lang.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: fs(10.5), fontWeight: 600, color: '#1B1B1B' }}>
                      {lang.name}
                    </span>
                    <Dots value={lang.level} accent={accent} />
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
