/**
 * Instagram-style outline icons (24x24, stroke = currentColor).
 * Keeping them inline means no extra icon package is needed.
 */
export function HomeIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle
        cx="10.5"
        cy="10.5"
        r="8"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 16.5 22 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function ExploreIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M15.8 8.2 13.4 13.4 8.2 15.8l2.4-5.2z"
        fill={filled ? "#fff" : "none"}
        stroke={filled ? "#fff" : "currentColor"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReelsIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2.8 8.4h18.4M8.4 2.8l3.4 5.4M14.4 2.8l3.4 5.4"
        stroke={filled ? "#fff" : "currentColor"}
        strokeWidth="1.8"
      />
      <path
        d="M10 12.4v5.2l4.6-2.6z"
        fill={filled ? "#fff" : "currentColor"}
        stroke="none"
      />
    </svg>
  );
}

export function SendIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M22 2 11 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 2 15 22l-4-9-9-4z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 0 4.9 16.5l4.1 1.5-1.5-4.1A9 9 0 0 0 12 3Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 13.5 2.4-5 5-2.4-2.4 5z"
        fill={filled ? "#fff" : "none"}
        stroke={filled ? "#fff" : "currentColor"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ filled = false, size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M12 21.1 4.6 13.7a4.9 4.9 0 1 1 7-6.9l.4.4.4-.4a4.9 4.9 0 1 1 7 6.9Z"
        fill={filled ? "#ed4956" : "none"}
        stroke={filled ? "#ed4956" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CreateIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7.5v9M7.5 12h9"
        stroke={filled ? "#fff" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BookmarkIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M5 3h14v18l-7-5-7 5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="19" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function PersonIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 21a8 8 0 0 1 16 0z" fill="currentColor" />
    </svg>
  );
}

export function GridIcon({ active = false }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path
        d="M3 3h5v5H3zM10.5 3h5v5h-5zM18 3h3v5h-3zM3 10.5h5v5H3zM10.5 10.5h5v5h-5zM18 10.5h3v5h-3zM3 18h5v3H3zM10.5 18h5v3h-5zM18 18h3v3h-3z"
        fill="currentColor"
        stroke="none"
        opacity={active ? 1 : 0.9}
      />
    </svg>
  );
}

export function TaggedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="17"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.6" fill="currentColor" />
      <path d="M7 17.5a5 5 0 0 1 10 0z" fill="currentColor" />
    </svg>
  );
}

export function ReelsTabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M2.8 8.4h18.4M8.4 2.8l3.4 5.4M14.4 2.8l3.4 5.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 12.4v5.2l4.6-2.6z" fill="currentColor" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M15 4 7 12l8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M5 5l14 14M19 5 5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.7" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15.3" cy="10" r="1.3" fill="currentColor" />
      <path
        d="M8.3 14.4a4.6 4.6 0 0 0 7.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlusIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M4.5 7.5l2 1.2M17.5 15.3l2 1.2M4.5 16.5l2-1.2M17.5 8.7l2-1.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PersonAddIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="9.5" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3 20a6.5 6.5 0 0 1 13 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M18.5 7v6M15.5 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MediaIcon() {
  return (
    <svg viewBox="0 0 48 48" width="72" height="72" aria-hidden="true">
      <rect
        x="6"
        y="10"
        width="36"
        height="28"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <circle cx="17" cy="20" r="3.4" fill="currentColor" />
      <path
        d="M8 34 20 24l7 6 6-5 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
