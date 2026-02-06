import Link from 'next/link';

export const metadata = {
  title: 'Under maintenance | Launchit',
  description: 'Launchit is temporarily under maintenance. We\'ll be back shortly.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-foreground">We&apos;re under maintenance</h1>
        <p className="text-muted-foreground">
          We&apos;re making things better. Please check back shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          If you have access, <Link href="/register" className="text-primary underline font-medium">sign in here</Link>.
        </p>
      </div>
    </div>
  );
}
