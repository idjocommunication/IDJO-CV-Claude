import { Description, Icon, Photo, TemplateProps, svgIcon } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { periodLabel } from '@/lib/utils'

/**
 * Modèle « Lagune » — colonne latérale pleine (photo, pitch, expertises,
 * distinctions) et colonne principale (expérience, formation).
 */
export function TemplateLagune({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const accent = theme.accent
  // La colonne latérale porte la couleur ; en mode sobre elle reste anthracite.
  const sidebar = theme.fill === 0 ? '#1E1E1E' : theme.flat
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  const sideHeading = (label: string) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ margin: 0, fontSize: fs(14), fontWeight: 700, color: '#FFFFFF' }}>{label}</p>
      <span
        style={{
          display: 'block',
          height: 1,
          background: 'rgba(255,255,255,.45)',
          marginTop: 8,
        }}
      />
    </div>
  )

  const mainHeading = (label: string) => (
    <div style={{ marginBottom: 18 }}>
      <p style={{ margin: 0, fontSize: fs(16), fontWeight: 700, color: '#111111' }}>{label}</p>
      <span style={{ display: 'block', height: 2, background: accent, marginTop: 8, opacity: 0.85 }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: 'inherit', fontSize: fs(10), lineHeight: 1.55 }}>
      {/* Colonne latérale */}
      <aside
        style={{
          flex: '0 0 34%',
          background: sidebar,
          color: theme.onAccent,
          padding: '46px 26px 40px',
        }}
      >
        {settings.showPhoto ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <Photo
              src={profile.photo}
              firstName={profile.firstName}
              lastName={profile.lastName}
              size={150}
              accent="#7A7A7A"
              tone="#EDEDED"
              style={{ border: '4px solid rgba(255,255,255,.9)' }}
            />
          </div>
        ) : null}

        {sideHeading('À propos')}
        <Description
          text={profile.about}
          style={{
            fontSize: fs(9.6),
            color: 'rgba(255,255,255,.88)',
            textAlign: 'justify',
            marginBottom: 34,
          }}
        />

        {data.skills.length ? (
          <>
            {sideHeading('Expertises')}
            <ul style={{ margin: '0 0 34px', padding: 0, listStyle: 'none' }}>
              {data.skills.map((skill) => (
                <li
                  key={skill.id}
                  style={{ fontSize: fs(10.5), marginBottom: 9, color: 'rgba(255,255,255,.92)' }}
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {data.languages.length ? (
          <>
            {sideHeading('Langues')}
            <ul style={{ margin: '0 0 34px', padding: 0, listStyle: 'none' }}>
              {data.languages.map((lang) => (
                <li
                  key={lang.id}
                  style={{
                    fontSize: fs(10.5),
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'rgba(255,255,255,.92)',
                  }}
                >
                  <span>{lang.name}</span>
                  <span style={{ opacity: 0.75 }}>{levelWord(lang.level)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {data.awards.length ? (
          <>
            {sideHeading('Distinctions')}
            {data.awards.map((award) => (
              <div key={award.id} style={{ marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: fs(9.6), color: 'rgba(255,255,255,.8)' }}>
                  {[award.period, award.organization].filter(Boolean).join(' | ')}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: fs(10.5), fontWeight: 700 }}>
                  {award.title}
                </p>
              </div>
            ))}
          </>
        ) : null}
      </aside>

      {/* Colonne principale */}
      <main
        style={{
          flex: 1,
          background: theme.bold ? theme.panel : '#F7F7F7',
          padding: '46px 34px 40px',
          color: '#2B2B2B',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: fs(34),
            fontWeight: 800,
            color: accent,
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
          }}
        >
          {profile.firstName}
          <br />
          <span style={{ fontWeight: 400, letterSpacing: '0.14em' }}>{profile.lastName}</span>
        </p>
        <p style={{ margin: '8px 0 16px', fontSize: fs(13), color: '#4A4A4A' }}>
          {profile.title}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            rowGap: 7,
            columnGap: 16,
            fontSize: fs(9.6),
            marginBottom: 30,
          }}
        >
          {[
            { icon: svgIcon.phone, value: profile.phone },
            { icon: svgIcon.globe, value: profile.website },
            { icon: svgIcon.mail, value: profile.email },
            {
              icon: svgIcon.pin,
              value: [profile.address, profile.city].filter(Boolean).join(', '),
            },
          ]
            .filter((i) => i.value)
            .map((item, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon path={item.icon} size={12} color={accent} />
                {item.value}
              </span>
            ))}
        </div>

        {mainHeading('Expérience')}
        {data.experiences.map((exp) => (
          <div key={exp.id} className="cv-block" style={{ marginBottom: 22 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
              }}
            >
              <strong style={{ fontSize: fs(12), color: '#111111' }}>{exp.role}</strong>
              <span style={{ fontSize: fs(11), fontWeight: 700, color: '#111111' }}>
                {exp.current ? 'Aujourd’hui' : exp.end || exp.start}
              </span>
            </div>
            <p style={{ margin: '2px 0 5px', fontSize: fs(10.4), color: '#3F3F3F' }}>
              {[exp.company, exp.location].filter(Boolean).join('  |  ')}
              {exp.start ? `  |  ${periodLabel(exp.start, exp.end, exp.current)}` : ''}
            </p>
            <Description text={exp.description} style={{ fontSize: fs(9.8), color: '#5A5A5A' }} />
          </div>
        ))}

        <div style={{ marginTop: 30 }}>{mainHeading('Formation')}</div>
        {data.educations.map((edu) => (
          <div key={edu.id} className="cv-block" style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
              }}
            >
              <strong style={{ fontSize: fs(12), color: '#111111' }}>{edu.degree}</strong>
              <span style={{ fontSize: fs(11), fontWeight: 700, color: '#111111' }}>
                {edu.end || edu.start}
              </span>
            </div>
            <p style={{ margin: '2px 0 5px', fontSize: fs(10.4), color: '#3F3F3F' }}>
              {[edu.school, edu.location].filter(Boolean).join('  |  ')}
            </p>
            <Description text={edu.description} style={{ fontSize: fs(9.8), color: '#5A5A5A' }} />
          </div>
        ))}

        {data.references.length ? (
          <>
            <div style={{ marginTop: 30 }}>{mainHeading('Références')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {data.references.map((ref) => (
                <div key={ref.id}>
                  <strong style={{ fontSize: fs(10.6), color: '#111111' }}>{ref.name}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: fs(9.6), color: '#5A5A5A' }}>
                    {[ref.role, ref.company].filter(Boolean).join(' — ')}
                  </p>
                  <p style={{ margin: 0, fontSize: fs(9.6), color: '#5A5A5A' }}>{ref.contact}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}

function levelWord(level: number) {
  if (level >= 95) return 'Langue maternelle'
  if (level >= 80) return 'Courant'
  if (level >= 60) return 'Intermédiaire'
  if (level >= 35) return 'Notions'
  return 'Débutant'
}
