export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[linear-gradient(160deg,#1a2e0f_0%,#243d16_35%,#1e3512_65%,#162808_100%)]">
      {children}
    </main>
  );
}
