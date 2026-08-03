import { Bar, Description, Photo, TemplateProps } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { fullName, periodLabel } from '@/lib/utils'

/**
 * Modèle « Cocody » — carte latérale arrondie (contact, références,
 * compétences, centres d'intérêt) et colonne principale (parcours, formation),
 * encadrée par deux barres d'accent.
 */
export function TemplateCocody({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const accent = theme.accent
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  const sideTitle = (label: string) => (
    <p
      style={{
        margin: '0 0 12px',
        fontSize: fs(14),
        fontWeight: 800,
        textAlign: 'center',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: theme.filled ? theme.deep : '#111111',
      }}
    >
      {label}
    </p>
  )

  const mainTitle = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: accent }} />
      <p
        style={{
          margin: 0,
          fontSize: fs(17),
          fontWeight: 800,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: '#111111',
        }}
      >
        {label}
      </p>
    </div>
  )

  return (
    <div
      style={{
        background: theme.panel,
        padding: '30px 28px 34px',
        fontSize: fs(10),
        color: '#3A3A3A',
        lineHeight: 1.55,
        minHeight: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 22, flex: 1, alignItems: 'stretch' }}>
        {/* Carte latérale */}
        <aside
          style={{
            flex: '0 0 33%',
            border: `1px solid ${theme.filled ? theme.hairline : '#CFCFCF'}`,
            borderRadius: 140,
            padding: '26px 20px 34px',
            background: '#FFFFFF',
          }}
        >
          {settings.showPhoto ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 22,
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  width: 138,
                  height: 138,
                  borderRadius: '50%',
                  border: `2px solid ${accent}`,
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                  transform: 'rotate(35deg)',
                }}
              />
              <Photo
                src={profile.photo}
                firstName={profile.firstName}
                lastName={profile.lastName}
                size={124}
                accent={accent}
              tone={theme.panelSoft}
                style={{ background: '#EDEDED' }}
              />
            </div>
          ) : null}

          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <span
              style={{
                display: 'inline-block',
                border: `1px solid ${accent}`,
                color: accent,
                borderRadius: 999,
                padding: '3px 14px',
                fontSize: fs(10),
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Contact
            </span>
            <div style={{ marginTop: 10, fontSize: fs(9.8) }}>
              {[
                profile.phone,
                profile.email,
                profile.website,
                [profile.address, profile.city].filter(Boolean).join(', '),
              ]
                .filter(Boolean)
                .map((line, i) => (
                  <p key={i} style={{ margin: '0 0 3px' }}>
                    {line}
                  </p>
                ))}
            </div>
          </div>

          {data.references.length ? (
            <div style={{ marginBottom: 22 }}>
              {sideTitle('Références')}
              {data.references.map((ref) => (
                <div key={ref.id} style={{ textAlign: 'center', marginBottom: 10 }}>
                  <strong style={{ fontSize: fs(10), color: '#111111' }}>{ref.name}</strong>
                  <p style={{ margin: '1px 0 0', fontSize: fs(9.2) }}>
                    {[ref.role, ref.company].filter(Boolean).join(', ')}
                  </p>
                  <p style={{ margin: 0, fontSize: fs(9.2) }}>{ref.contact}</p>
                </div>
              ))}
            </div>
          ) : null}

          {data.skills.length ? (
            <div style={{ marginBottom: 22 }}>
              {sideTitle('Compétences')}
              {data.skills.map((skill) => (
                <div key={skill.id} style={{ marginBottom: 10 }}>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: fs(9.8),
                      fontWeight: 700,
                      textAlign: 'center',
                      color: '#111111',
                    }}
                  >
                    {skill.name}
                  </p>
                  <Bar value={skill.level} accent={accent} height={4} track="#E4E4E4" />
                </div>
              ))}
            </div>
          ) : null}

          {data.hobbies.length ? (
            <div>
              {sideTitle('Centres d’intérêt')}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', textAlign: 'center' }}>
                {data.hobbies.map((hobby) => (
                  <li
                    key={hobby}
                    style={{
                      fontSize: fs(9.8),
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 4,
                      color: '#2B2B2B',
                    }}
                  >
                    {hobby}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        {/* Colonne principale */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p
            style={{
              margin: 0,
              fontSize: fs(30),
              fontWeight: 800,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: accent,
              lineHeight: 1.1,
            }}
          >
            {profile.firstName}{' '}
            <span style={{ fontWeight: 400, color: '#3A3A3A' }}>{profile.lastName}</span>
          </p>
          <p
            style={{
              margin: '3px 0 12px',
              fontSize: fs(11),
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#5A5A5A',
            }}
          >
            {profile.title}
          </p>
          <span
            style={{ display: 'block', height: 10, borderRadius: 999, background: accent }}
            aria-hidden
          />

          <div style={{ marginTop: 20 }}>
            <span
              style={{
                display: 'inline-block',
                border: `1px solid ${accent}`,
                color: accent,
                borderRadius: 999,
                padding: '3px 14px',
                fontSize: fs(10),
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Profil
            </span>
            <div style={{ borderLeft: '1px solid #C9C9C9', paddingLeft: 14 }}>
              <Description text={profile.about} style={{ fontSize: fs(10.2) }} />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>{mainTitle('Expérience')}</div>
          <div style={{ borderLeft: '1px solid #C9C9C9', paddingLeft: 16 }}>
            {data.experiences.map((exp) => (
              <div key={exp.id} className="cv-block" style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                  }}
                >
                  <strong
                    style={{
                      fontSize: fs(11.5),
                      textTransform: 'uppercase',
                      color: '#111111',
                    }}
                  >
                    {exp.role}
                  </strong>
                  <span style={{ fontSize: fs(9.6), fontWeight: 700, color: accent }}>
                    {periodLabel(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                <p style={{ margin: '1px 0 4px', fontSize: fs(10), color: '#4A4A4A' }}>
                  {[exp.company, exp.location].filter(Boolean).join(' — ')}
                </p>
                <Description text={exp.description} style={{ fontSize: fs(9.8) }} />
              </div>
            ))}
          </div>

          <span
            style={{ display: 'block', height: 1, background: theme.hairline, margin: '18px 0' }}
          />

          {mainTitle('Formation')}
          <div style={{ borderLeft: '1px solid #C9C9C9', paddingLeft: 16 }}>
            {data.educations.map((edu) => (
              <div key={edu.id} className="cv-block" style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                  }}
                >
                  <strong
                    style={{
                      fontSize: fs(11.5),
                      textTransform: 'uppercase',
                      color: '#111111',
                    }}
                  >
                    {edu.degree}
                  </strong>
                  <span style={{ fontSize: fs(9.6), fontWeight: 700, color: accent }}>
                    {periodLabel(edu.start, edu.end)}
                  </span>
                </div>
                <p style={{ margin: '1px 0 4px', fontSize: fs(10), color: '#4A4A4A' }}>
                  {[edu.school, edu.location].filter(Boolean).join(' — ')}
                </p>
                <Description text={edu.description} style={{ fontSize: fs(9.8) }} />
              </div>
            ))}
          </div>

          <span
            style={{
              display: 'block',
              height: 10,
              borderRadius: 999,
              background: accent,
              marginTop: 'auto',
            }}
            aria-hidden
          />
          <p style={{ margin: '10px 0 0', fontSize: fs(9), color: '#8A8A8A' }}>
            {fullName(profile.firstName, profile.lastName)}
          </p>
        </main>
      </div>
    </div>
  )
}
