import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { createObservationShareLinkAction } = vi.hoisted(() => ({
  createObservationShareLinkAction: vi.fn(),
}));
vi.mock('@/features/observations/actions/share-mutations', () => ({ createObservationShareLinkAction }));

import ShareObservationButton from './ShareObservationButton';

const originalFetch = global.fetch;
const originalShare = navigator.share;
const originalCanShare = navigator.canShare;

function mockImageFetch() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob(['fake-png-bytes'], { type: 'image/png' })),
  }) as unknown as typeof fetch;
}

describe('ShareObservationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createObservationShareLinkAction.mockResolvedValue({ success: true, shareSlug: 'abc123' });
    mockImageFetch();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: originalCanShare, configurable: true });
  });

  it('uses native share when the browser supports sharing files', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });

    const user = userEvent.setup();
    render(<ShareObservationButton observationId="obs-1" birdName="European Robin" frameColor="#198b58" />);

    await user.click(screen.getByRole('button', { name: /share observation of european robin/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1));
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('/share/observation/abc123') }),
    );
    expect(screen.queryByText(/copy link/i)).not.toBeInTheDocument();
  });

  it('treats a cancelled native share as a normal action, not an error', async () => {
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')),
      configurable: true,
    });

    const user = userEvent.setup();
    render(<ShareObservationButton observationId="obs-1" birdName="European Robin" frameColor="#198b58" />);

    await user.click(screen.getByRole('button', { name: /share observation of european robin/i }));

    await waitFor(() => expect(createObservationShareLinkAction).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/copy link/i)).not.toBeInTheDocument();
  });

  it('falls back to Copy link / Download image when file sharing is unsupported', async () => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });

    const user = userEvent.setup();
    render(<ShareObservationButton observationId="obs-1" birdName="European Robin" frameColor="#198b58" />);

    await user.click(screen.getByRole('button', { name: /share observation of european robin/i }));

    expect(await screen.findByRole('button', { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download image/i })).toBeInTheDocument();
  });

  it('copies the share link to the clipboard and shows a confirmation', async () => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });

    const user = userEvent.setup();
    // user-event installs its own jsdom Clipboard stub (with its own afterEach
    // reset) the first time navigator.clipboard is touched, which fights any
    // Object.defineProperty override placed before that point. Spy on the
    // stub's writeText instead of replacing the whole clipboard object.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(<ShareObservationButton observationId="obs-1" birdName="European Robin" frameColor="#198b58" />);

    await user.click(screen.getByRole('button', { name: /share observation of european robin/i }));
    await user.click(await screen.findByRole('button', { name: /copy link/i }));

    expect(await screen.findByText(/copied!/i)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/share/observation/abc123'));
  });

  it('shows an inline error and does not attempt to fetch the share image when the action fails', async () => {
    createObservationShareLinkAction.mockResolvedValue({ error: 'Observation not found' });

    const user = userEvent.setup();
    render(<ShareObservationButton observationId="obs-1" birdName="European Robin" frameColor="#198b58" />);

    await user.click(screen.getByRole('button', { name: /share observation of european robin/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Observation not found');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
