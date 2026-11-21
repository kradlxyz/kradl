import React from "react";

export function KradlLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="#111114" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" stroke="#27272A" strokeWidth="1.5" />
      <path
        d="M7.5 17.5C7.5 22.1944 11.3056 26 16 26C20.6944 26 24.5 22.1944 24.5 17.5"
        stroke="#FAFAFA"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 17.5C11 20.2614 13.2386 22.5 16 22.5C18.7614 22.5 21 20.2614 21 17.5"
        stroke="#52525B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M16 7L20 12.25L16 16.5L12 12.25L16 7Z" fill="#FAFAFA" />
      <circle cx="16" cy="12" r="1.6" fill="#10B981" />
    </svg>
  );
}
