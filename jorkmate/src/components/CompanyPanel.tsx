import type { Job } from '../types'

/** CSS/SVG company identity panel, no remote logos, per demo constraints. */
export function CompanyPanel({ job, compact = false }: { job: Job; compact?: boolean }) {
  const { initials, from, to, pattern } = job.brand
  const pid = `${job.id}-${pattern}`
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden ${
        compact ? 'h-12 w-12 rounded-xl' : 'h-40 w-full'
      }`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <svg className="absolute inset-0 h-full w-full opacity-20" role="presentation">
        <defs>
          {pattern === 'dots' && (
            <pattern id={pid} width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="2" fill="white" />
            </pattern>
          )}
          {pattern === 'grid' && (
            <pattern id={pid} width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M22 0H0v22" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          )}
          {pattern === 'waves' && (
            <pattern id={pid} width="40" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 7q10 -8 20 0t20 0" fill="none" stroke="white" strokeWidth="1.6" />
            </pattern>
          )}
          {pattern === 'rings' && (
            <pattern id={pid} width="34" height="34" patternUnits="userSpaceOnUse">
              <circle cx="17" cy="17" r="11" fill="none" stroke="white" strokeWidth="1.4" />
            </pattern>
          )}
          {pattern === 'diagonal' && (
            <pattern id={pid} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="3" height="14" fill="white" />
            </pattern>
          )}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
      </svg>
      <span
        className={`font-display relative font-bold text-white drop-shadow-md ${compact ? 'text-lg' : 'text-5xl'}`}
      >
        {initials}
      </span>
    </div>
  )
}
