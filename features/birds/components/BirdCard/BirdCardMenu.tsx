'use client';

import { useState, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { deleteBirdAction } from '@/features/birds/actions/delete-bird-mutation';
import AdminBadge from '@/shared/ui/AdminBadge/AdminBadge';
import ConfirmDeleteModal from '@/shared/ui/ConfirmDeleteModal/ConfirmDeleteModal';

interface Props {
  birdId: number;
  birdName: string;
}

export default function BirdCardMenu({ birdId, birdName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function openDeleteConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    setDeleteError(null);
    setConfirmDelete(true);
  }

  function handleDeleteConfirmed() {
    startDeleteTransition(async () => {
      const result = await deleteBirdAction({ birdId });
      if (result && 'error' in result) {
        setDeleteError(typeof result.error === 'string' ? result.error : 'Failed to delete bird.');
        return;
      }
      setConfirmDelete(false);
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        aria-label={`Admin actions for ${birdName}`}
        className="relative shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
      >
        <MoreVertical size={16} aria-hidden="true" />
        <AdminBadge className="absolute -top-0.5 -right-0.5 w-3 h-3 border-2 border-card" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-40 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/birds/${birdId}/edit`}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-foreground hover:bg-secondary/60 transition-colors no-underline"
        >
          <Pencil size={14} aria-hidden="true" />
          Edit
        </Link>
        <button
          type="button"
          onClick={openDeleteConfirm}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </PopoverContent>

      {confirmDelete && (
        <ConfirmDeleteModal
          title="Delete bird"
          error={deleteError}
          pending={deletePending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(false)}
        >
          Delete <span className="font-semibold">{birdName}</span> from the catalog? This cannot be undone.
        </ConfirmDeleteModal>
      )}
    </Popover>
  );
}
