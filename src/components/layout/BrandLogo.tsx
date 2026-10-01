/* The Yukti 360 logo. The wordmark already carries the full product name, so
   it stands in for the name wherever the brand appears — never typed out as
   text. `mark` is the square "Y" cut from the same artwork, for tight spots
   such as the collapsed nav rail. Assets live in /public/brand. */

interface BrandLogoProps {
  /** 'wordmark' (default) or the square 'mark'. */
  variant?: 'wordmark' | 'mark';
  /** Rendered height in px; the width follows the artwork's aspect. */
  height?: number;
  className?: string;
}

const WORDMARK_ASPECT = 353 / 120;

export function BrandLogo({ variant = 'wordmark', height = 28, className = '' }: BrandLogoProps) {
  if (variant === 'mark') {
    return (
      <img
        src="/brand/yukti-mark.png"
        alt="Yukti 360"
        width={height}
        height={height}
        decoding="async"
        draggable={false}
        className={`select-none shrink-0 ${className}`}
      />
    );
  }
  return (
    <img
      src="/brand/yukti-360.png"
      alt="Yukti 360"
      width={Math.round(height * WORDMARK_ASPECT)}
      height={height}
      decoding="async"
      draggable={false}
      className={`select-none shrink-0 ${className}`}
    />
  );
}
