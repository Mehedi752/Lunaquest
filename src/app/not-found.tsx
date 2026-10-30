import Link from 'next/link';
import { Emblem } from '@/components/lq/icons';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div className="flex flex-col items-center gap-5">
        <Emblem size={48} />
        <div className="label">Signal lost · 404</div>
        <h1 className="text-4xl font-semibold tracking-[-.03em]">This sector hasn’t been mapped.</h1>
        <Link href="/" className={buttonVariants()}>Return to base</Link>
      </div>
    </main>
  );
}
