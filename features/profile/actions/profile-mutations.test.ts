import { describe, expect, it, vi, beforeEach } from 'vitest';

const { setNickname } = vi.hoisted(() => ({
  setNickname: vi.fn(),
}));
vi.mock('@/features/profile/profile-queries', () => ({
  setNickname,
}));

const { requireAuth } = vi.hoisted(() => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));
vi.mock('@/features/auth/auth-helpers', () => ({
  requireAuth,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { setNicknameAction } from './profile-mutations';

describe('setNicknameAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ id: 'user-1' });
  });

  it('rejects a nickname that is too short', async () => {
    const result = await setNicknameAction({ nickname: 'ab' });

    expect('error' in result).toBe(true);
    expect(setNickname).not.toHaveBeenCalled();
  });

  it('rejects a nickname with disallowed characters', async () => {
    const result = await setNicknameAction({ nickname: 'bird guy!' });

    expect('error' in result).toBe(true);
    expect(setNickname).not.toHaveBeenCalled();
  });

  it('saves a valid nickname scoped to the current user', async () => {
    setNickname.mockResolvedValue(undefined);

    const result = await setNicknameAction({ nickname: 'bird_guy_42' });

    expect(result).toEqual({ success: true });
    expect(setNickname).toHaveBeenCalledWith('user-1', 'bird_guy_42');
  });

  it('trims whitespace before validating', async () => {
    setNickname.mockResolvedValue(undefined);

    const result = await setNicknameAction({ nickname: '  birdy  ' });

    expect(result).toEqual({ success: true });
    expect(setNickname).toHaveBeenCalledWith('user-1', 'birdy');
  });

  it('treats an empty string as clearing the nickname', async () => {
    setNickname.mockResolvedValue(undefined);

    const result = await setNicknameAction({ nickname: '' });

    expect(result).toEqual({ success: true });
    expect(setNickname).toHaveBeenCalledWith('user-1', null);
  });

  it('allows explicitly clearing the nickname with null', async () => {
    setNickname.mockResolvedValue(undefined);

    const result = await setNicknameAction({ nickname: null });

    expect(result).toEqual({ success: true });
    expect(setNickname).toHaveBeenCalledWith('user-1', null);
  });

  it('returns a friendly error when the nickname is already taken', async () => {
    setNickname.mockRejectedValue(new Error('setNickname: duplicate key value violates unique constraint "profiles_nickname_lower_key"'));

    const result = await setNicknameAction({ nickname: 'taken' });

    expect(result).toEqual({ error: 'That nickname is already taken.' });
  });

  it('requires auth before validating or writing', async () => {
    requireAuth.mockImplementation(() => {
      throw new Error('redirected');
    });

    await expect(setNicknameAction({ nickname: 'birdy' })).rejects.toThrow('redirected');
    expect(setNickname).not.toHaveBeenCalled();
  });
});
