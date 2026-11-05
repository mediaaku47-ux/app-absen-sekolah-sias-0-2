import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  showBackground?: boolean;
  rounded?: boolean;
}

/**
 * AppLogo: Official SIAS attendance logo featuring student profile,
 * time dial arc, and checkmark on the signature emerald-to-blue gradient.
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-9 h-9',
  rounded = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${
        rounded ? 'rounded-2xl' : ''
      } ${className}`}
      aria-label="Logo SIAS"
    >
      <img
        src="/assets/logo.png"
        srcSet="/assets/logo-192.png 192w, /assets/logo.png 1025w"
        sizes="(max-width: 640px) 48px, 96px"
        alt="Logo SIAS"
        className="w-full h-full object-cover"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
