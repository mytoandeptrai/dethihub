'use client'
import type { ReactNode } from 'react'
export function SectionUi({
  id,
  eyebrow,
  title,
  description,
  children,
  tone = '',
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  tone?: string
}) {
  return (
    <section id={id} aria-labelledby={id + '-title'} className={'home-section ' + tone}>
      <div className="home-container">
        <header className="home-section-heading">
          <p className="home-eyebrow">{eyebrow}</p>
          <h2 id={id + '-title'}>{title}</h2>
          {description && <p>{description}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}
