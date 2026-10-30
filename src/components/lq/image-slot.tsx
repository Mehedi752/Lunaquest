import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Image placeholder. Pass `src` once licensed / public-domain imagery is available
 * (see HANDOFF.md → Required imagery). Until then it renders a labelled, striped slot.
 */
export function ImageSlot({ src, alt, label, className, priority }: {
  src?: string; alt: string; label: string; className?: string; priority?: boolean;
}) {
  if (src) return <Image src={src} alt={alt} fill priority={priority} sizes="100vw" className={cn('object-cover', className)} />;
  return (
    <div role="img" aria-label={alt}
      className={cn('absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,rgba(145,160,183,.05)_0_10px,transparent_10px_20px)]', className)}>
      <span className="flex max-w-[80%] flex-col items-center gap-2 text-center font-mono text-[11px] leading-snug text-ink-faint">
        <ImageIcon className="size-5" aria-hidden />
        {label}
      </span>
    </div>
  );
}
