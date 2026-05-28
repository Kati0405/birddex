import Link from 'next/link';
import { getUser } from '@/features/auth/auth-helpers';
import { logoutAction } from '@/app/(auth)/actions';

export default async function AuthBar() {
  const user = await getUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-semibold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-primary max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
        {user.email}
      </span>
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-xs font-semibold uppercase tracking-widest text-primary/80 bg-transparent border-0 cursor-pointer transition-colors hover:text-primary"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
