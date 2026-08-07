import Image from 'next/image';

/**
 * CAREERS — a real photo of a professional carrying her laptop in an
 * office (not a home setting), filling the right side completely. The
 * section's own background video (see `PageHero`'s `backgroundVideo` prop
 * on the Careers page) already carries the color/motion, so this is just
 * the photo — no card, no border, no overlay.
 */
export function CultureVisual() {
  return (
    <div className="relative h-full w-full">
      <Image
        src="/images/careers/student-laptop-office.webp"
        alt="A professional carrying her laptop in the office"
        fill
        sizes="(min-width: 1024px) 460px, 100vw"
        className="object-cover"
        priority
      />
    </div>
  );
}
