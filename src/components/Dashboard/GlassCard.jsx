/**
 * Carte verre dépoli (réutilisable pour sections type Kimi / AT).
 */
export default function GlassCard({
  children,
  className = '',
  darkMode = false,
  as: Tag = 'div',
  ...rest
}) {
  return (
    <Tag
      className={`rounded-[20px] border border-solid shadow-sm backdrop-blur-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] ${className}`}
      style={{
        background: darkMode
          ? 'rgba(26, 29, 46, 0.8)'
          : 'rgba(255, 255, 255, 0.92)',
        borderColor: darkMode ? '#2A2D3E' : 'rgba(15, 23, 42, 0.06)',
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
