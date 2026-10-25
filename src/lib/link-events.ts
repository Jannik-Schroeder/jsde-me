/** Only fixed public destinations; no message text or visitor-supplied properties. */
export function linkEvent(href: string) {
  const event = href === 'mailto:contact@jsde.me' ? 'contact_link_clicked'
    : href === 'https://github.com/Jannik-Schroeder' ? 'github_profile_clicked'
    : href === 'https://phanes.net' || href === 'https://phanes.net/' ? 'project_link_clicked'
    : undefined
  return event ? { 'data-rybbit-event': event } : {}
}
