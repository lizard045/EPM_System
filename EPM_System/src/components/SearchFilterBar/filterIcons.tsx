/**
 * 搜尋與篩選列圖示
 */

export function FilterSlidersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h10M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="18" cy="7" r="2.5" fill="currentColor" />
      <circle cx="14" cy="12" r="2.5" fill="currentColor" />
      <circle cx="20" cy="17" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h16v3H4V5zm0 5h16v4H4v-4zm0 6h16v4H4v-4z"
        fill="currentColor"
      />
    </svg>
  );
}

interface SearchIconProps {
  className?: string;
}

export function SearchIcon({ className }: SearchIconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16.5 16.5L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SortLinesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h12M4 12h8M4 18h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 8v8M18 8l3 3M18 8l-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FunnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h16l-6.5 8v5l-3 2v-7L4 5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
