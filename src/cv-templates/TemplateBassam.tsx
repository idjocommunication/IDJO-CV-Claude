import type { ReactNode } from 'react'
import { Bar, Description, Icon, Photo, TemplateProps, svgIcon } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { periodLabel } from '@/lib/utils'

/**
 * Modèle « Bassam » — bandeau de couleur portant la photo et le nom, bloc
 * sombre « à propos / contact », puis deux colonnes sur fond clair
 * (références et formation à gauche, expérience et compétences à droite).
 */
export function TemplateBassam({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const accent = theme.accent
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  const banner = theme.band
  const bannerInk = theme.onBand
  // Bloc sombre : dérivé de la teinte quand la couleur est autorisée.
  const dark = theme.filled ? theme.deep : '#1E1E1E'

  const heading = (label: string, path: string, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon path={path} size={12} color={theme.onAccent} />
      </span>
      <p
        style={{
          margin: 0,
          fontSize: fs(15),
          fontWeight: 800,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color,
        }}
      >
        {label}
      </p>
    </div>
  )

  /** Colonne verticale pointillée reliant les entrées d'une section. */
  const rail = (children: ReactNode, color: string) => (
    <div style={{ position: 'relative', paddingLeft: 18 }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 10,
          top: 4,
          bottom: 6,
          width: 1,
          background: color,
          opacity: 0.55,
        }}
      />
      {children}
    </div>
  )

  const dot = (color: string) => (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: -12,
        top: 5,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
      }}
    />
  )

  return (
    <div
      style={{
        fontSize: fs(10),
        color: '#3A3A3A',
        lineHeight: 1.55,
        minHeight: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Bandeau : photo posée à cheval sur la bande de couleur */}
      <div style={{ position: 'relative', paddingTop: 26, background: '#FFFFFF' }}>
        <div
          style={{
            background: banner,
            padding: '26px 44px 26px 250px',
            minHeight: 116,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: fs(30),
              fontWeight: 800,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: bannerInk,
              lineHeight: 1.12,
            }}
          >
            {profile.firstName} {profile.lastName}
          </p>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: fs(13),
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: bannerInk,
              opacity: 0.85,
            }}
          >
            {profile.title}
          </p>
        </div>

        {settings.showPhoto ? (
          <div style={{ position: 'absolute', top: 26, left: 52 }}>
            <div style={{ background: '#FFFFFF', padding: 8, boxShadow: '0 0 0 1px #E2E2E2' }}>
              <Photo
                src={profile.photo}
                firstName={profile.firstName}
                lastName={profile.lastName}
                size={158}
                radius={0}
                accent={accent}
                tone={theme.panelSoft}
              />
            </div>
          </div>
        ) : null}
      </div>

      <span style={{ height: 26, background: '#FFFFFF', display: 'block' }} aria-hidden />

      {/* Bloc sombre : à propos + contact */}
      <div
        style={{
          background: dark,
          color: 'rgba(255,255,255,.88)',
          display: 'flex',
          gap: 40,
          padding: '28px 44px 30px',
        }}
      >
        <section style={{ flex: '1 1 55%' }}>
          {heading('À propos', svgIcon.pin, '#FFFFFF')}
          <Description
            text={profile.about}
            style={{ fontSize: fs(9.8), textAlign: 'justify' }}
          />
        </section>

        <section style={{ flex: '1 1 45%' }}>
          {heading('Me contacter', svgIcon.phone, '#FFFFFF')}
          {rail(
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: svgIcon.phone, value: profile.phone },
                { icon: svgIcon.globe, value: [profile.website, profile.email].filter(Boolean).join('\n') },
                {
                  icon: svgIcon.pin,
                  value: [profile.address, profile.city].filter(Boolean).join('\n'),
                },
              ]
                .filter((item) => item.value)
                .map((item, i) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', gap: 10 }}>
                    {dot(accent)}
                    <Icon path={item.icon} size={13} color={accent} />
                    <div style={{ fontSize: fs(9.8) }}>
                      {item.value.split('\n').map((line) => (
                        <p key={line} style={{ margin: 0, wordBreak: 'break-word' }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
            </div>,
            'rgba(255,255,255,.5)',
          )}
        </section>
      </div>

      {/* Deux colonnes sur fond clair */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 34,
          padding: '30px 44px 34px',
          background: theme.panel,
        }}
      >
        <div style={{ flex: '1 1 38%' }}>
          {data.references.length ? (
            <section style={{ marginBottom: 30 }}>
              {heading(
                'Références',
                'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
                '#111111',
              )}
              {rail(
                <>
                  {data.references.map((ref) => (
                    <div key={ref.id} className="cv-block" style={{ position: 'relative', marginBottom: 14 }}>
                      {dot(accent)}
                      <strong style={{ fontSize: fs(10.6), textTransform: 'uppercase', color: '#111111' }}>
                        {ref.name}
                      </strong>
                      <p style={{ margin: '2px 0 0', fontSize: fs(9.6) }}>
                        {[ref.role, ref.company].filter(Boolean).join(', ')}
                      </p>
                      <p style={{ margin: 0, fontSize: fs(9.6) }}>{ref.contact}</p>
                    </div>
                  ))}
                </>,
                accent,
              )}
            </section>
          ) : null}

          {data.educations.length ? (
            <section>
              {heading(
                'Formation',
                'M22 10 12 5 2 10l10 5 10-5Z M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
                '#111111',
              )}
              {rail(
                <>
                  {data.educations.map((edu) => (
                    <div key={edu.id} className="cv-block" style={{ position: 'relative', marginBottom: 14 }}>
                      {dot(accent)}
                      <strong style={{ fontSize: fs(10.6), textTransform: 'uppercase', color: '#111111' }}>
                        {edu.school}
                      </strong>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: fs(9.4),
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {edu.degree}
                      </p>
                      <p style={{ margin: 0, fontSize: fs(9.4), color: '#5A5A5A' }}>
                        {periodLabel(edu.start, edu.end)}
                      </p>
                    </div>
                  ))}
                </>,
                accent,
              )}
            </section>
          ) : null}
        </div>

        <div style={{ flex: '1 1 62%' }}>
          {data.experiences.length ? (
            <section style={{ marginBottom: 30 }}>
              {heading(
                'Expérience',
                'M4 7h16v13H4z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
                '#111111',
              )}
              {rail(
                <>
                  {data.experiences.map((exp) => (
                    <div key={exp.id} className="cv-block" style={{ position: 'relative', marginBottom: 16 }}>
                      {dot(accent)}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          gap: 12,
                        }}
                      >
                        <strong
                          style={{ fontSize: fs(11), textTransform: 'uppercase', color: '#111111' }}
                        >
                          {exp.role}
                        </strong>
                        <span style={{ fontSize: fs(9.4), fontWeight: 700, color: accent }}>
                          {periodLabel(exp.start, exp.end, exp.current)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: '1px 0 4px',
                          fontSize: fs(9.8),
                          fontStyle: 'italic',
                          color: '#4A4A4A',
                        }}
                      >
                        {[exp.company, exp.location].filter(Boolean).join(' / ')}
                      </p>
                      <Description text={exp.description} style={{ fontSize: fs(9.6) }} />
                    </div>
                  ))}
                </>,
                accent,
              )}
            </section>
          ) : null}

          {data.skills.length ? (
            <section>
              {heading('Compétences', 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', '#111111')}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 22,
                  rowGap: 8,
                  paddingLeft: 18,
                }}
              >
                {data.skills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <span style={{ fontSize: fs(9.2), fontWeight: 700, flex: '0 0 46%' }}>
                      {skill.name}
                    </span>
                    <Bar value={skill.level} accent={accent} height={5} track="#DFDFDF" />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <span style={{ display: 'block', height: 20, background: banner }} aria-hidden />
    </div>
  )
}
