import { signInWithGoogleAction } from '../actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div
      className="w-full max-w-sm rounded-xl p-8 space-y-6"
      style={{
        background: 'linear-gradient(170deg, #faf6ed 0%, #f0e6cc 45%, #e4d5b0 100%)',
        border: '1px solid #c4a87840',
      }}
    >
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black" style={{ color: '#2a1808', fontFamily: 'var(--font-playfair)' }}>
          BirdDex
        </h1>
        <p className="text-sm italic" style={{ color: '#8a6c44', fontFamily: 'var(--font-playfair)' }}>
          Your field journal awaits
        </p>
      </div>

      <form action={signInWithGoogleAction}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 rounded-lg py-2.5 text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: '#ffffff', color: '#1a1208', border: '1px solid #c4a87860' }}
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </form>

      <p className="text-center text-[11px] leading-relaxed" style={{ color: '#8a6c44' }}>
        By signing in you agree to keep your field notes somewhat accurate.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
