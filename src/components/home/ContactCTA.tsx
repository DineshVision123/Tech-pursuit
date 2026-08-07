import { ClosingCTA } from '@/components/ui/ClosingCTA';

/** Homepage-specific copy wrapping the shared closing CTA. */
export function ContactCTA() {
  return (
    <ClosingCTA
      title={
        <>
          Have a product to build?
          <br />
          Let’s pursue it together.
        </>
      }
    />
  );
}
