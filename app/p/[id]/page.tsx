import { getPaste } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PastePage({ params }: PageProps) {
  const { id } = params;

  // Get paste without incrementing views (HTML view is just for display)
  const paste = await getPaste(id, false);

  if (!paste) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paste Content</h1>
            <p className="text-sm text-gray-500">ID: {id}</p>
          </div>

          <div className="bg-gray-50 rounded p-4 mb-6 border border-gray-200">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">
              {paste.content}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {paste.max_views !== undefined && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-gray-600">View Limit</p>
                <p className="font-semibold text-gray-900">{paste.max_views} views</p>
              </div>
            )}
            {paste.ttl_seconds !== undefined && (
              <div className="bg-orange-50 p-3 rounded border border-orange-200">
                <p className="text-gray-600">Expires in</p>
                <p className="font-semibold text-gray-900">{paste.ttl_seconds}s</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
