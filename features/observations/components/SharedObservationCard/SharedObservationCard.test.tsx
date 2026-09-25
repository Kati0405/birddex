import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SharedObservationCard from './SharedObservationCard';
import type { ObservationShareData } from '@/features/observations/public-share-queries';

function makeData(overrides: Partial<ObservationShareData> = {}): ObservationShareData {
  return {
    shareSlug: 'abc123',
    birdName: 'European Robin',
    scientificName: 'Erithacus rubecula',
    rarity: 'Common',
    photo: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/observations/robin.jpg',
      source: 'observation',
      credit: 'birdwatcher42',
      creditUrl: null,
    },
    observedAt: '2026-05-01T10:00:00Z',
    location: { displayName: 'Lviv, Lviv Oblast' },
    methods: { seen: true, heard: false, photographed: true },
    quality: 4,
    isFirstObservationOfSpecies: false,
    author: { displayName: 'birdwatcher42' },
    ...overrides,
  };
}

describe('SharedObservationCard', () => {
  it('shows the "Look who I found!" header', () => {
    render(<SharedObservationCard data={makeData()} />);

    expect(screen.getByText('Look who I found!')).toBeInTheDocument();
  });

  it('shows the bird name, scientific name, rarity, date, and location', () => {
    render(<SharedObservationCard data={makeData()} />);

    expect(screen.getByText('European Robin')).toBeInTheDocument();
    expect(screen.getByText('Erithacus rubecula')).toBeInTheDocument();
    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.getByText('1 May 2026')).toBeInTheDocument();
    expect(screen.getByText('Lviv, Lviv Oblast')).toBeInTheDocument();
  });

  it('shows only the observation methods that are true', () => {
    render(<SharedObservationCard data={makeData({ methods: { seen: true, heard: false, photographed: true } })} />);

    expect(screen.getByText('Seen')).toBeInTheDocument();
    expect(screen.getByText('Photographed')).toBeInTheDocument();
    expect(screen.queryByText('Heard')).not.toBeInTheDocument();
  });

  it('hides the methods row entirely when no method was recorded', () => {
    render(
      <SharedObservationCard
        data={makeData({ methods: { seen: false, heard: false, photographed: false }, quality: null })}
      />,
    );

    expect(screen.queryByText('Seen')).not.toBeInTheDocument();
    expect(screen.queryByText('Heard')).not.toBeInTheDocument();
    expect(screen.queryByText('Photographed')).not.toBeInTheDocument();
  });

  it('omits the location line when there is no resolved location', () => {
    render(<SharedObservationCard data={makeData({ location: { displayName: null } })} />);

    expect(screen.getByText('1 May 2026')).toBeInTheDocument();
    expect(screen.queryByText(/oblast/i)).not.toBeInTheDocument();
  });

  it('shows the first-encounter badge only when isFirstObservationOfSpecies is true', () => {
    const { rerender } = render(<SharedObservationCard data={makeData({ isFirstObservationOfSpecies: true })} />);
    expect(screen.getByAltText(/first encounter with this species/i)).toBeInTheDocument();

    rerender(<SharedObservationCard data={makeData({ isFirstObservationOfSpecies: false })} />);
    expect(screen.queryByAltText(/first encounter with this species/i)).not.toBeInTheDocument();
  });

  it('credits the observer by nickname for an observation photo, and links out to Wikimedia for a bird-default photo', () => {
    const { rerender } = render(
      <SharedObservationCard
        data={makeData({ photo: { url: 'https://example.com/obs.jpg', source: 'observation', credit: 'kati_feyko', creditUrl: null } })}
      />,
    );
    expect(screen.getByText('Photo by kati_feyko')).toBeInTheDocument();

    rerender(
      <SharedObservationCard
        data={makeData({
          photo: {
            url: 'https://upload.wikimedia.org/robin.jpg',
            source: 'bird-default',
            credit: 'Jane Doe / Wikimedia Commons',
            creditUrl: 'https://commons.wikimedia.org/robin',
          },
        })}
      />,
    );
    const link = screen.getByRole('link', { name: /jane doe \/ wikimedia commons/i });
    expect(link).toHaveAttribute('href', 'https://commons.wikimedia.org/robin');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('falls back to "birds.in.ua" credit when there is no photo credit', () => {
    render(
      <SharedObservationCard
        data={makeData({ photo: { url: 'https://example.com/bird.jpg', source: 'bird-default', credit: null, creditUrl: null } })}
      />,
    );

    expect(screen.getByText('Photo: birds.in.ua')).toBeInTheDocument();
  });

  it('shows the observer line only when the author has a display name', () => {
    const { rerender } = render(<SharedObservationCard data={makeData({ author: { displayName: 'kati_feyko' } })} />);
    expect(screen.getByText('kati_feyko', { selector: 'span' })).toBeInTheDocument();

    rerender(<SharedObservationCard data={makeData({ author: { displayName: null } })} />);
    expect(screen.queryByText(/observed by/i)).not.toBeInTheDocument();
  });
});
