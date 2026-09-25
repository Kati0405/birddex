import { requireAuth } from '@/features/auth/auth-helpers';
import { getNickname } from '@/features/profile/profile-queries';
import NicknameForm from '@/features/profile/components/NicknameForm/NicknameForm';
import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/shared/ui/primitives/button';
import PageBackdrop from '@/shared/ui/PageBackdrop';

export default async function AccountPage() {
  const user = await requireAuth();
  const nickname = await getNickname(user.id);
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Unknown';

  return (
    <PageBackdrop>
      <div className='max-w-screen-sm mx-auto px-6 py-8 space-y-6'>
        <h1 className='font-heading text-2xl'>Account</h1>
        <NicknameForm currentNickname={nickname} fullName={fullName} />

        <form action={logoutAction}>
          <Button type='submit' variant='destructive'>
            Log out
          </Button>
        </form>
      </div>
    </PageBackdrop>
  );
}
