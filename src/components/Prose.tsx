import clsx from 'clsx'

/**
 * Wraps MDX article bodies. `prose prose-invert` comes from
 * @tailwindcss/typography (loaded via @plugin in globals.css); the rest of
 * the classes retune it to the site's dark palette and monospace code
 * blocks instead of the library defaults. See the "Article prose" block at
 * the end of globals.css for the parts that can't be expressed as utility
 * classes (code block backgrounds, pre scroll behaviour).
 */
export function Prose({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx('prose prose-invert prose-jsde max-w-none', className)}
      {...props}
    />
  )
}
