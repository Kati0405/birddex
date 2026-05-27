export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #1a2e0f 0%, #243d16 35%, #1e3512 65%, #162808 100%)' }}
    >
      {children}
    </main>
  );
}
