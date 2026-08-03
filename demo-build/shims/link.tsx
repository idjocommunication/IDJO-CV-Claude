import type { AnchorHTMLAttributes, ReactNode } from 'react'

/** Remplace next/link dans la démo autonome. */
export default function Link({
  href,
  children,
  ...props
}: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const onClick = (event: React.MouseEvent) => {
    event.preventDefault()
    const id = href.startsWith('/lettre-de-motivation')
      ? 'lettre'
      : href.startsWith('/editeur') || href.startsWith('/modeles')
        ? 'demo-editeur'
        : null
    const target = id ? document.getElementById(id) : null
    target?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  )
}
