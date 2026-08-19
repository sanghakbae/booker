/**
 * Monochrome toolbar icons. Emoji were inconsistent across platforms and the
 * colour ones broke the toolbar's visual rhythm; these inherit currentColor.
 */
type Props = { className?: string };

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const BoldIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />
  </svg>
);

export const ItalicIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M19 4h-9M14 20H5M15 4L9 20" />
  </svg>
);

export const StrikeIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 12h16M17 7a4 4 0 0 0-4-3h-2a3.5 3.5 0 0 0-1.6 6.6M7.5 17a4 4 0 0 0 4 3h1.5a3.5 3.5 0 0 0 2.4-6" />
  </svg>
);

export const CodeIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);

export const BulletListIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </svg>
);

export const OrderedListIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M10 6h10M10 12h10M10 18h10M4 6h1v4M4 10h2M4 15h2v3H4z" strokeWidth={1.7} />
  </svg>
);

export const TaskListIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M11 6h9M11 12h9M11 18h9M3 6.5l1.5 1.5L7.5 5M3 16.5L4.5 18 7.5 15" />
  </svg>
);

export const QuoteIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 17c3 0 4-2 4-5V6H4v6h3c0 2-.5 3-1 3zM17 17c3 0 4-2 4-5V6h-6v6h3c0 2-.5 3-1 3z" />
  </svg>
);

export const LinkIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

export const CodeBlockIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 10l-2 2 2 2M15 10l2 2-2 2" strokeWidth={1.7} />
  </svg>
);

export const TableIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M9 10v10M15 10v10" />
  </svg>
);

export const DividerIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 12h18" />
  </svg>
);

export const CalloutIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const ImageIcon = (p: Props) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 16l-5-5-6 6-2-2-5 5" />
  </svg>
);

export const ExpandIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const CollapseIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M3 8h3a2 2 0 0 0 2-2V3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M21 16h-3a2 2 0 0 0-2 2v3" />
  </svg>
);

export const MenuIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const CloseIcon = (p: Props) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const SearchIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const MoreIcon = (p: Props) => (
  <svg {...base} {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </svg>
);
