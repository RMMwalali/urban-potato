import Link from "next/link";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-2xl font-semibold text-brand-700">SpaDesk</Link>
        <div className="card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
