import Link from 'next/link';
import { getUser } from '@/features/auth/auth-helpers';
import { logoutAction } from '@/app/(auth)/actions';

export default async function AuthBar() {
  const user = await getUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-semibold uppercase tracking-widest transition-colors"
        style={{ color: '#6a9048' }}
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs"
        style={{ color: '#6a9048', fontFamily: 'var(--font-dm-mono)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {user.email}
      </span>
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-xs font-semibold uppercase tracking-widest transition-colors"
          style={{ color: '#4a6838' }}
        >
          Log out
        </button>
      </form>
    </div>
  );
}
