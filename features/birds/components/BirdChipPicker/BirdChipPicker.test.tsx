import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BirdChipPicker from './BirdChipPicker';
import type { StaticImageData } from 'next/image';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const FAKE_IMAGE = { src: '/fake.png', height: 1, width: 1 } as StaticImageData;

type TestValue = 'insects' | 'seeds' | 'fish';
const VALUES: TestValue[] = ['insects', 'seeds', 'fish'];
const IMAGE_FOR: Record<TestValue, StaticImageData> = {
  insects: FAKE_IMAGE,
  seeds: FAKE_IMAGE,
  fish: FAKE_IMAGE,
};

function setup(
  overrides: Partial<
    React.ComponentProps<typeof BirdChipPicker<TestValue>>
  > = {},
) {
  const onToggle = vi.fn();
  const props = {
    label: 'Food',
    values: VALUES,
    imageFor: IMAGE_FOR,
    selected: [] as TestValue[],
    max: 2,
    onToggle,
    ...overrides,
  };
  render(<BirdChipPicker {...props} />);
  return { onToggle, props };
}

function chipFor(value: TestValue) {
  return screen.getByRole('button', { name: new RegExp(`^${value}\\b`) });
}

describe('BirdChipPicker', () => {
  it('renders a chip for every value with the label and count', () => {
    setup({ selected: ['insects'], max: 3 });

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('(1/3)')).toBeInTheDocument();
    for (const value of VALUES) {
      expect(chipFor(value)).toBeInTheDocument();
    }
  });

  it('calls onToggle with the clicked value', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup();

    await user.click(chipFor('seeds'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('seeds');
  });

  it('marks selected values with aria/disabled state left enabled', () => {
    setup({ selected: ['insects'], max: 3 });

    expect(chipFor('insects')).not.toBeDisabled();
  });

  it('disables unselected chips once the max is reached', () => {
    setup({ selected: ['insects', 'seeds'], max: 2 });

    expect(chipFor('fish')).toBeDisabled();
    // Already-selected chips must stay clickable so the user can deselect them
    expect(chipFor('insects')).not.toBeDisabled();
    expect(chipFor('seeds')).not.toBeDisabled();
  });

  it('does not fire onToggle when clicking a disabled chip', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup({ selected: ['insects', 'seeds'], max: 2 });

    await user.click(chipFor('fish'));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('still allows toggling off a selected chip when at max', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup({ selected: ['insects', 'seeds'], max: 2 });

    await user.click(chipFor('insects'));

    expect(onToggle).toHaveBeenCalledWith('insects');
  });

  it('re-enables a chip once selection drops below max', () => {
    setup({ selected: ['insects'], max: 2 });

    expect(chipFor('fish')).not.toBeDisabled();
  });
});
