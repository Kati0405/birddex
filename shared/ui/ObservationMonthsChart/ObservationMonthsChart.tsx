const INITIALS = ['J','F','M','A','M','J','J','A','S','O','N','D'];

const BAR_ACTIVE   = '#6b5030';
const BAR_INACTIVE = '#c4a87830';
const LBL_ACTIVE   = '#6b5030';
const LBL_INACTIVE = '#c4a87870';

interface Props {
  bestMonths: number[];
}

export default function ObservationMonthsChart({ bestMonths = [] }: Props) {
  return (
    <div className="flex gap-px w-full">
      {INITIALS.map((label, i) => {
        const active = bestMonths.includes(i + 1);
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className="w-full rounded-sm"
              style={{ height: 5, background: active ? BAR_ACTIVE : BAR_INACTIVE }}
            />
            <span
              className="text-[6.5px] leading-none font-medium"
              style={{ color: active ? LBL_ACTIVE : LBL_INACTIVE }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
