// Lightweight stroke-based icon set (heroicons-style), no external dependency.
const S = ({ children, className = 'w-5 h-5', ...p }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...p}
  >
    {children}
  </svg>
)

export const IconDashboard = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </S>
)
export const IconUsers = (p) => (
  <S {...p}>
    <path d="M16 19a4 4 0 0 0-8 0" />
    <circle cx="12" cy="8" r="3.2" />
    <path d="M20 19a3.5 3.5 0 0 0-4-3.4M4 19a3.5 3.5 0 0 1 4-3.4" />
  </S>
)
export const IconSeat = (p) => (
  <S {...p}>
    <path d="M6 4v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4" />
    <path d="M5 13h14l-1 5H6l-1-5Z" />
    <path d="M7 18v2M17 18v2" />
  </S>
)
export const IconUserPlus = (p) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M18 8v6M21 11h-6" />
  </S>
)
export const IconSparkles = (p) => (
  <S {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
  </S>
)
export const IconBuilding = (p) => (
  <S {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3" />
  </S>
)
export const IconCheck = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </S>
)
export const IconClock = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
)
export const IconWrench = (p) => (
  <S {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L4 17v3h3l5.5-5.5a4 4 0 0 0 5.2-5.2l-2.5 2.5-2-2 2.5-2.5Z" />
  </S>
)
export const IconLock = (p) => (
  <S {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </S>
)
export const IconChart = (p) => (
  <S {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </S>
)
export const IconSearch = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </S>
)
export const IconClose = (p) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
)
export const IconChevronLeft = (p) => (
  <S {...p}>
    <path d="m14 6-6 6 6 6" />
  </S>
)
export const IconChevronRight = (p) => (
  <S {...p}>
    <path d="m10 6 6 6-6 6" />
  </S>
)
export const IconRelease = (p) => (
  <S {...p}>
    <path d="M9 12h9m0 0-3-3m3 3-3 3" />
    <path d="M13 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
  </S>
)
export const IconSend = (p) => (
  <S {...p}>
    <path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" />
  </S>
)
export const IconMenu = (p) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
)
export const IconPin = (p) => (
  <S {...p}>
    <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
    <circle cx="12" cy="11" r="2.2" />
  </S>
)
