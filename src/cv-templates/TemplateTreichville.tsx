import { Description, Photo, TemplateProps } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { periodLabel } from '@/lib/utils'

/**
 * Modèle « Treichville » — colonne latérale sombre (profil, formation,
 * contact) posée sur un aplat de couleur arrondi, face à une colonne blanche
 * où le nom est surligné. Compétences en segments, centres d'intérêt en puces.
 */
export function TemplateTreichville({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  // La colonne reste anthracite quelle que soit la palette : c'est le bloc
  // d'accent qui porte la couleur, et qui suit la dose choisie.
  const ink = '#1C1C1C'
  const block = theme.band

  const sideTitle = (label: string) => (
    <p
      style={{
        margin: '0 0 12px',
        fontSize: fs(16),
        fontWeight: 800,
        color: '#FFFFFF',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </p>
  )

  const mainTitle = (label: string) => (
    <p
      style={{
        margin: '0 0 14px',
        fontSize: fs(17),
        fontWeight: 800,
        color: ink,
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </p>
  )

  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'inherit',
        fontSize: fs(10),
        color: '#3A3A3A',
        lineHeight: 1.6,
      }}
    >
      {/* Colonne latérale */}
      <aside style={{ flex: '0 0 45%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {settings.showPhoto ? (
          <Photo
            src={profile.photo}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size={357}
            radius={0}
            accent="#8A8A8A"
            tone="#2A2A2A"
            style={{ width: '100%', height: 300 }}
          />
        ) : (
          <div style={{ height: 96, background: ink }} />
        )}

        {/* Aplat de couleur : il dépasse à droite et arrondit le haut du bloc noir. */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: settings.showPhoto ? 300 : 96,
            left: 0,
            right: -30,
            height: 92,
            background: block,
            borderTopRightRadius: 46,
            borderBottomRightRadius: 46,
          }}
        />

        <div
          style={{
            position: 'relative',
            flex: 1,
            background: ink,
            color: 'rgba(255,255,255,.86)',
            padding: '34px 30px 40px',
            marginTop: 26,
          }}
        >
          {profile.about ? (
            <div style={{ marginBottom: 30 }}>
              {sideTitle('Profil')}
              <Description
                text={profile.about}
                style={{ fontSize: fs(9.6), textAlign: 'justify' }}
              />
            </div>
          ) : null}

          {data.educations.length ? (
            <div style={{ marginBottom: 30 }}>
              {sideTitle('Formation')}
              {data.educations.map((edu) => (
                <div key={edu.id} className="cv-block" style={{ marginBottom: 14, paddingLeft: 12, position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 16,
                      bottom: 2,
                      width: 3,
                      background: block,
                    }}
                  />
                  <p style={{ margin: 0, fontSize: fs(9.6), color: 'rgba(255,255,255,.7)' }}>
                    {periodLabel(edu.start, edu.end)}
                  </p>
                  <strong style={{ fontSize: fs(10.6), color: '#FFFFFF' }}>{edu.school}</strong>
                  <p style={{ margin: 0, fontSize: fs(9.8) }}>{edu.degree}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div>
            {[
              { label: 'Téléphone :', value: profile.phone },
              { label: 'Site :', value: profile.website },
              { label: 'E-mail :', value: profile.email },
              {
                label: 'Adresse :',
                value: [profile.address, profile.city].filter(Boolean).join(', '),
              },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div
                  key={item.label}
                  style={{ position: 'relative', paddingLeft: 12, marginBottom: 12 }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 3,
                      bottom: 3,
                      width: 3,
                      background: block,
                    }}
                  />
                  <p style={{ margin: 0, fontSize: fs(10), fontWeight: 700, color: '#FFFFFF' }}>
                    {item.label}
                  </p>
                  <p style={{ margin: 0, fontSize: fs(9.8), wordBreak: 'break-word' }}>
                    {item.value}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </aside>

      {/* Colonne principale */}
      <main style={{ flex: 1, padding: '52px 40px 44px 46px' }}>
        <p style={{ margin: 0, lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: fs(24),
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: ink,
            }}
          >
            {profile.firstName}
          </span>
        </p>
        <p style={{ margin: '4px 0 0' }}>
          <span
            style={{
              display: 'inline-block',
              background: block,
              color: theme.onBand,
              padding: '2px 10px',
              fontSize: fs(27),
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              lineHeight: 1.25,
            }}
          >
            {profile.lastName}
          </span>
        </p>
        <p
          style={{
            margin: '12px 0 0',
            display: 'inline-block',
            borderTop: `2px solid ${ink}`,
            borderBottom: `2px solid ${ink}`,
            padding: '2px 0',
            fontSize: fs(13),
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: ink,
          }}
        >
          {profile.title}
        </p>

        {data.experiences.length ? (
          <section style={{ marginTop: 44 }}>
            {mainTitle('Expérience professionnelle')}
            {data.experiences.map((exp) => (
              <div key={exp.id} className="cv-block" style={{ marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: fs(9.6), color: '#6A6A6A' }}>
                  {periodLabel(exp.start, exp.end, exp.current)}
                </p>
                <strong style={{ fontSize: fs(11), color: ink }}>{exp.role}</strong>
                <p style={{ margin: '0 0 5px', fontSize: fs(10), color: '#4A4A4A' }}>
                  {[exp.company, exp.location].filter(Boolean).join(' — ')}
                </p>
                <Description
                  text={exp.description}
                  style={{ fontSize: fs(9.6), textAlign: 'justify' }}
                />
              </div>
            ))}
          </section>
        ) : null}

        {data.skills.length ? (
          <section style={{ marginTop: 34 }}>
            {mainTitle('Compétences')}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: 22,
                rowGap: 9,
              }}
            >
              {data.skills.map((skill) => (
                <div
                  key={skill.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
                >
                  <span style={{ fontSize: fs(9.8) }}>{skill.name}</span>
                  <span style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: 4,
                          height: 11,
                          background: i < Math.round((skill.level / 100) * 6) ? block : '#DDDDDD',
                        }}
                      />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.languages.length ? (
          <section style={{ marginTop: 30 }}>
            {mainTitle('Langues')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
              {data.languages.map((lang) => (
                <span
                  key={lang.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: fs(9.8) }}
                >
                  <span style={{ width: 3, height: 13, background: block }} />
                  {lang.name}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {data.hobbies.length ? (
          <section style={{ marginTop: 30 }}>
            {mainTitle('Centres d’intérêt')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
              {data.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: fs(9.8) }}
                >
                  <span style={{ width: 3, height: 13, background: block }} />
                  {hobby}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
