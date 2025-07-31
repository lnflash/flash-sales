import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function EditSubmissionPage() {
  const router = useRouter();
  const { id } = router.query;
  
  // Redirect to intake form with edit mode
  useEffect(() => {
    if (id) {
      router.replace(`/intake?id=${id}&mode=edit`);
    }
  }, [id, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
        <p className="mt-4 text-light-text-secondary">Redirecting to edit form...</p>
      </div>
    </div>
  );
}