// Reusable Twitter / X share button
export const XShareButton = ({ onClick, size = "sm", label = "Share", className = "" }) => {
  return (
    <button
      onClick={onClick}
      title="Share on X (Twitter)"
      className={`flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors duration-150 ${className}`}
    >
      <XIcon size={size === "sm" ? 12 : 14} />
      {label && <span>{label}</span>}
    </button>
  );
};

export const XIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="X (Twitter)">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
