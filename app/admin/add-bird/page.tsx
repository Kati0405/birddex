import { requireAdmin } from '@/features/auth/auth-helpers';
import AddBirdForm from '@/features/birds/components/AddBirdForm/AddBirdForm';

export default async function AddBirdPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-lg font-bold mb-6">Add Bird</h1>
      <AddBirdForm />
    </div>
  );
}
