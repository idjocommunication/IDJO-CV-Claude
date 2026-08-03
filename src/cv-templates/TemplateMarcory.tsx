import type { CSSProperties } from 'react'
import { Description, Icon, Photo, TemplateProps, svgIcon } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { fullName, periodLabel } from '@/lib/utils'

/**
 * Modèle « Marcory » — bandeaux arrondis en haut et en bas, photo encadrée
 * face au bloc de contact, cartouche du nom, puis deux colonnes symétriques
 * (formation à gauche, expérience à droite) séparées par deux rails verticaux.
 * Compétences et références ferment la page sur un aplat clair.
 */
export function TemplateMarcory({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const accent = theme.accent
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  // En mode sobre, les grands aplats redeviennent gris : seuls les filets et
  // les titres portent la couleur.
  const band = theme.band
  const rail = theme.filled ? theme.hairline : '#DFDFDF'

  const heading = (label: string, path: string, align: 'right' | 'left' = 'left') => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
      }}
    >
      <Icon path={path} size={17} color="#4A4A4A" strokeWidth={1.7} />
      <p
        style={{
          margin: 0,
          fontSize: fs(19),
          fontWeight: 800,
          letterSpacing: '0.01em',
          textTransform: 'uppercase',
          color: accent,
        }}
      >
        {label}
      </p>
    </div>
  )

  /** Encoche de la timeline centrale : un petit trait posé sur le rail. */
  const notch = (side: 'left' | 'right'): CSSProperties => ({
    position: 'absolute',
    top: 6,
    [side === 'left' ? 'left' : 'right']: -24,
    width: 13,
    height: 3,
    borderRadius: 2,
    background: accent,
  })

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
      {/* Bandeau supérieur */}
      <div style={{ display: 'flex', height: 34 }} aria-hidden>
        <span style={{ width: '32%', background: '#575757' }} />
        <span
          style={{
            flex: 1,
            background: band,
            borderBottomLeftRadius: 34,
            borderBottomRightRadius: 6,
          }}
        />
      </div>

      {/* Photo + contact */}
      <div style={{ display: 'flex', gap: 34, padding: '30px 46px 0', alignItems: 'center' }}>
        {settings.showPhoto ? (
          <div style={{ position: 'relative', padding: '10px 0 10px 12px' }}>
            <span
              style={{
                position: 'absolute',
                inset: '0 26px 20px 0',
                border: `1px solid ${rail}`,
                borderRadius: 10,
              }}
            />
            <Photo
              src={profile.photo}
              firstName={profile.firstName}
              lastName={profile.lastName}
              size={186}
              radius={12}
              accent={accent}
              tone={theme.panelSoft}
              style={{ position: 'relative' }}
            />
          </div>
        ) : null}

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: theme.panel,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon path={svgIcon.phone} size={14} color={accent} />
            </span>
            <p
              style={{
                margin: 0,
                fontSize: fs(19),
                fontWeight: 800,
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              Me contacter
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[profile.phone, [profile.website, profile.email].filter(Boolean).join('\n'), [profile.address, profile.city].filter(Boolean).join('\n')]
              .filter(Boolean)
              .map((bloc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <span
                    style={{
                      width: 22,
                      height: 3,
                      borderRadius: 2,
                      background: rail,
                      marginTop: 7,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ fontSize: fs(11) }}>
                    {bloc.split('\n').map((line) => (
                      <p key={line} style={{ margin: 0 }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Cartouche du nom */}
      <div
        style={{
          margin: '22px 46px 0',
          background: theme.panel,
          borderTopRightRadius: 26,
          borderBottomRightRadius: 26,
          padding: '12px 28px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: fs(31),
            fontWeight: 800,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: accent,
            lineHeight: 1.1,
          }}
        >
          {fullName(profile.firstName, profile.lastName)}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: fs(14),
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#6A6A6A',
          }}
        >
          {profile.title}
        </p>
      </div>

      {/* À propos */}
      {profile.about ? (
        <div style={{ padding: '26px 62px 0', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <Icon path={svgIcon.pin} size={16} color="#4A4A4A" strokeWidth={1.7} />
            <p
              style={{
                margin: 0,
                fontSize: fs(19),
                fontWeight: 800,
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              À propos
            </p>
          </div>
          <Description text={profile.about} style={{ fontSize: fs(10.6) }} />
        </div>
      ) : null}

      {/* Formation / Expérience */}
      <div style={{ display: 'flex', gap: 48, padding: '26px 46px 0', position: 'relative' }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 6,
            bottom: 10,
            left: '50%',
            marginLeft: -1,
            width: 2,
            background: accent,
            opacity: 0.75,
          }}
        />

        <section style={{ flex: 1, textAlign: 'right' }}>
          {heading('Formation', 'M22 10 12 5 2 10l10 5 10-5Z M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5', 'right')}
          {data.educations.map((edu) => (
            <div key={edu.id} className="cv-block" style={{ position: 'relative', marginBottom: 18 }}>
              <span style={notch('right')} />
              <strong
                style={{
                  fontSize: fs(11.5),
                  textTransform: 'uppercase',
                  color: '#2E2E2E',
                  display: 'block',
                }}
              >
                {edu.degree}
              </strong>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  margin: '3px 0 6px',
                  fontSize: fs(9.6),
                }}
              >
                <span style={{ fontWeight: 700, color: accent }}>
                  {periodLabel(edu.start, edu.end)}
                </span>
                <span style={{ color: '#5A5A5A' }}>
                  {[edu.school, edu.location].filter(Boolean).join(' — ')}
                </span>
              </div>
              <Description text={edu.description} style={{ fontSize: fs(9.8) }} />
            </div>
          ))}
        </section>

        <section style={{ flex: 1 }}>
          {heading('Expérience', 'M4 7h16v13H4z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2')}
          {data.experiences.map((exp) => (
            <div key={exp.id} className="cv-block" style={{ position: 'relative', marginBottom: 18 }}>
              <span style={notch('left')} />
              <strong
                style={{
                  fontSize: fs(11.5),
                  textTransform: 'uppercase',
                  color: '#2E2E2E',
                  display: 'block',
                }}
              >
                {exp.role}
              </strong>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  margin: '3px 0 6px',
                  fontSize: fs(9.6),
                }}
              >
                <span style={{ color: '#5A5A5A' }}>
                  {[exp.company, exp.location].filter(Boolean).join(' — ')}
                </span>
                <span style={{ fontWeight: 700, color: accent }}>
                  {periodLabel(exp.start, exp.end, exp.current)}
                </span>
              </div>
              <Description text={exp.description} style={{ fontSize: fs(9.8) }} />
            </div>
          ))}
        </section>
      </div>

      {/* Compétences / Références */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 30,
          background: theme.panel,
          borderTopLeftRadius: 60,
          marginLeft: 26,
        }}
      >
        <div style={{ display: 'flex', gap: 40, padding: '10px 46px 34px' }}>
          <section style={{ flex: '1 1 44%' }}>
            {heading('Compétences', 'M12 3v4 M12 17v4 M4.9 4.9l2.8 2.8 M16.3 16.3l2.8 2.8 M3 12h4 M17 12h4')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {data.skills.map((skill) => (
                <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    style={{ width: 22, height: 3, borderRadius: 2, background: accent, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: fs(10.4),
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#3A3A3A',
                    }}
                  >
                    {skill.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ flex: '1 1 56%' }}>
            {heading('Références', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z')}
            {data.references.map((ref) => (
              <div
                key={ref.id}
                className="cv-block"
                style={{ display: 'flex', gap: 10, marginBottom: 12 }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#2E2E2E',
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <strong
                    style={{ fontSize: fs(10.6), textTransform: 'uppercase', color: '#2E2E2E' }}
                  >
                    {ref.name}
                  </strong>
                  <p style={{ margin: '1px 0 0', fontSize: fs(9.6) }}>
                    {[ref.role, ref.company].filter(Boolean).join(', ')}
                  </p>
                  <p style={{ margin: 0, fontSize: fs(9.6) }}>{ref.contact}</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Bandeau inférieur */}
      <div style={{ display: 'flex', height: 32 }} aria-hidden>
        <span
          style={{
            width: '28%',
            background: band,
            borderTopRightRadius: 34,
          }}
        />
        <span style={{ flex: 1, background: '#575757' }} />
      </div>
    </div>
  )
}
