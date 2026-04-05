export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="12" className="fill-emerald-500/15" />
      <path
        d="M12 26c0-6 4-10 10-10h2v4h-2c-3.5 0-6 2.5-6 6v4h-4v-4Z"
        className="fill-emerald-400"
      />
      <path
        d="M22 14c6 0 10 4 10 10h-4c0-3.5-2.5-6-6-6h-2v-4h2Z"
        className="fill-emerald-300"
      />
    </svg>
  )
}
