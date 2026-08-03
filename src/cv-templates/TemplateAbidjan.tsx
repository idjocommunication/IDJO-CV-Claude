import type { CSSProperties } from 'react'
import { Bar, Description, Icon, Photo, Ring, TemplateProps, svgIcon } from './primitives'
import { resolveTheme } from '@/lib/theme'
import { fullName, periodLabel } from '@/lib/utils'

/**
 * Modèle « Abidjan » — bandeau d'accroche, résumé, barre de contact,
 * trois colonnes (expériences / formations / références) puis distinctions,
 * compétences et langues.
 */
export function TemplateAbidjan({ data }: TemplateProps) {
  const { profile, settings } = data
  const theme = resolveTheme(settings)
  const accent = theme.accent
  const fs = (n: number) => `${(n * settings.fontScale).toFixed(2)}px`

  // Bandeau du nom : teinté, ou rempli de couleur en mode intense.
  const bannerFilled = theme.bold
  const bannerBg = bannerFilled ? theme.flat : theme.panel
  const bannerInk = bannerFilled ? theme.onFlat : '#0A0A0A'

  const chip: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: theme.panel,
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: fs(11),
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }

  const timelineItem: CSSProperties = {
    position: 'relative',
    paddingLeft: 18,
    marginBottom: 18,
  }

  const timelineDot: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 6,
    height: 6,
    background: accent,
  }

  return (
    <div style={{ fontSize: fs(10), color: '#0A0A0A', lineHeight: 1.5 }}>
      {/* Bandeau nom */}
      <div style={{ background: bannerBg, padding: '22px 40px 18px', textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: fs(38),
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: bannerInk,
          }}
        >
          Bonjour.{' '}
          <span style={{ fontWeight: 500 }}>Je suis </span>
          <span style={{ color: bannerFilled ? theme.onFlat : accent }}>
            {fullName(profile.firstName, profile.lastName)}
          </span>
        </p>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: fs(12),
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: bannerFilled ? theme.onFlat : '#3A3A3A',
            opacity: bannerFilled ? 0.85 : 1,
          }}
        >
          {profile.title}
        </p>
      </div>

      {/* À propos */}
      <div style={{ display: 'flex', gap: 26, padding: '24px 40px 18px' }}>
        {settings.showPhoto ? (
          <div style={{ position: 'relative', paddingTop: 8, paddingLeft: 8 }}>
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 46,
                height: 46,
                borderTop: `2px solid ${accent}`,
                borderLeft: `2px solid ${accent}`,
                borderTopLeftRadius: 10,
              }}
            />
            <Photo
              src={profile.photo}
              firstName={profile.firstName}
              lastName={profile.lastName}
              size={112}
              radius={10}
              accent={accent}
              tone={theme.panelSoft}
              style={{ filter: 'grayscale(1)' }}
            />
          </div>
        ) : null}

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <span style={chip}>
              <Icon path={svgIcon.pin} size={12} color={accent} />À propos
            </span>
            <span style={{ flex: 1, height: 2, background: accent }} />
          </div>
          <div
            style={{
              borderLeft: '1px solid #D6D6D6',
              paddingLeft: 16,
              fontSize: fs(10.5),
              color: '#2E2E2E',
            }}
          >
            <Description text={profile.about} style={{ marginBottom: 8 }} />
          </div>
        </div>
      </div>

      {/* Barre de contact */}
      <div
        style={{
          background: theme.panelSoft,
          padding: '11px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          fontSize: fs(10),
        }}
      >
        <span
          style={{
            color: accent,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: fs(11),
          }}
        >
          Contact
        </span>
        {[
          { icon: svgIcon.phone, value: profile.phone },
          { icon: svgIcon.mail, value: profile.email },
          { icon: svgIcon.pin, value: profile.city || profile.address },
        ]
          .filter((i) => i.value)
          .map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon path={item.icon} size={12} color={accent} />
              {item.value}
            </span>
          ))}
      </div>

      {/* Trois colonnes */}
      <div style={{ display: 'flex', gap: 26, padding: '26px 40px 0' }}>
        <section style={{ flex: '1 1 40%' }}>
          <SectionHead label="Expérience" accent={accent} soft={theme.soft} fs={fs} rule />
          {data.experiences.map((exp) => (
            <div key={exp.id} className="cv-block" style={timelineItem}>
              <span style={timelineDot} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: fs(11), textTransform: 'uppercase' }}>
                  {exp.role}
                </strong>
                <span style={{ fontSize: fs(9.5), color: '#5A5A5A' }}>
                  {periodLabel(exp.start, exp.end, exp.current)}
                </span>
              </div>
              <p
                style={{
                  margin: '3px 0 6px',
                  fontSize: fs(10),
                  letterSpacing: '0.1em',
                  color: '#3A3A3A',
                }}
              >
                {[exp.company, exp.location].filter(Boolean).join(' / ')}
              </p>
              <Description
                text={exp.description}
                style={{ fontSize: fs(9.8), color: '#4A4A4A' }}
              />
            </div>
          ))}
        </section>

        <section style={{ flex: '1 1 32%' }}>
          <SectionHead label="Formation" accent={accent} soft={theme.soft} fs={fs} />
          {data.educations.map((edu) => (
            <div key={edu.id} className="cv-block" style={timelineItem}>
              <span style={timelineDot} />
              <strong style={{ fontSize: fs(11), textTransform: 'uppercase' }}>
                {edu.degree}
              </strong>
              <p style={{ margin: '2px 0 5px', fontSize: fs(9.6), color: '#3A3A3A' }}>
                {edu.school}{' '}
                <strong style={{ color: '#0A0A0A' }}>{periodLabel(edu.start, edu.end)}</strong>
              </p>
              <Description
                text={edu.description}
                style={{ fontSize: fs(9.6), color: '#4A4A4A' }}
              />
            </div>
          ))}
        </section>

        <section style={{ flex: '1 1 28%' }}>
          <SectionHead label="Références" accent={accent} soft={theme.soft} fs={fs} />
          {data.references.map((ref) => (
            <div key={ref.id} style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: fs(10.5), textTransform: 'uppercase' }}>
                {ref.name}
              </strong>
              <p style={{ margin: '3px 0 0', fontSize: fs(9.6), color: '#3A3A3A' }}>
                {[ref.role, ref.company].filter(Boolean).join(' — ')}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: fs(9.6), color: '#4A4A4A' }}>
                {ref.contact}
              </p>
            </div>
          ))}
        </section>
      </div>

      {/* Distinctions / compétences / langues */}
      <div style={{ display: 'flex', gap: 26, padding: '10px 40px 36px' }}>
        <section style={{ flex: '1 1 40%' }}>
          <SectionHead label="Distinctions" accent={accent} soft={theme.soft} fs={fs} rule />
          {data.awards.map((award) => (
            <div key={award.id} style={timelineItem}>
              <span style={timelineDot} />
              <strong style={{ fontSize: fs(10.5), textTransform: 'uppercase' }}>
                {award.title}
              </strong>
              <p style={{ margin: '2px 0 4px', fontSize: fs(9.6), color: '#3A3A3A' }}>
                {award.organization} <strong>{award.period}</strong>
              </p>
              <Description
                text={award.description}
                style={{ fontSize: fs(9.6), color: '#4A4A4A' }}
              />
            </div>
          ))}
        </section>

        <section style={{ flex: '1 1 32%' }}>
          <SectionHead label="Compétences" accent={accent} soft={theme.soft} fs={fs} />
          {data.skills.map((skill) => (
            <div key={skill.id} style={{ marginBottom: 11, display: 'flex', gap: 10 }}>
              <span style={{ width: 6, height: 6, background: accent, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 5px', fontSize: fs(10), fontWeight: 700 }}>
                  {skill.name}
                </p>
                <Bar value={skill.level} accent={accent} height={4} />
              </div>
            </div>
          ))}
        </section>

        <section style={{ flex: '1 1 28%' }}>
          <SectionHead label="Langues" accent={accent} soft={theme.soft} fs={fs} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              paddingTop: 4,
            }}
          >
            {data.languages.slice(0, 4).map((lang) => (
              <Ring key={lang.id} value={lang.level} label={lang.name} accent={accent} />
            ))}
          </div>
        </section>
      </div>

      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background: accent,
        }}
      />
    </div>
  )
}

function SectionHead({
  label,
  accent,
  soft,
  fs,
  rule = false,
}: {
  label: string
  accent: string
  soft: string
  fs: (n: number) => string
  rule?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
      <span
        style={{
          background: soft,
          padding: '6px 14px',
          borderRadius: 6,
          fontSize: fs(11),
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
        {label}
      </span>
      {rule ? <span style={{ flex: 1, height: 2, background: accent }} /> : null}
    </div>
  )
}
