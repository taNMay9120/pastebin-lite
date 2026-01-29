'use client';

import { useState } from 'react';

interface CreateResponse {
  id: string;
  url: string;
}

interface ErrorResponse {
  error: string;
}

export default function Home() {
  const [content, setContent] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const body: any = {
        content: content.trim(),
      };

      if (ttlSeconds) {
        body.ttl_seconds = parseInt(ttlSeconds, 10);
      }

      if (maxViews) {
        body.max_views = parseInt(maxViews, 10);
      }

      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as CreateResponse | ErrorResponse;

      if (!response.ok) {
        setError((data as ErrorResponse).error || 'Failed to create paste');
        return;
      }

      const createResponse = data as CreateResponse;
      setResult(createResponse);
      setContent('');
      setTtlSeconds('');
      setMaxViews('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pastebin Lite</h1>
          <p className="text-gray-600">Share text snippets with optional expiry and view limits</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Paste Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your text here..."
                rows={10}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ttl" className="block text-sm font-medium text-gray-700 mb-2">
                  Time-to-Live (seconds)
                </label>
                <input
                  id="ttl"
                  type="number"
                  value={ttlSeconds}
                  onChange={(e) => setTtlSeconds(e.target.value)}
                  placeholder="e.g., 3600"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
              </div>

              <div>
                <label htmlFor="views" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Views
                </label>
                <input
                  id="views"
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-medium mb-3">Paste created successfully!</p>
                <div className="bg-white p-3 rounded border border-green-200 mb-3">
                  <p className="text-sm text-gray-600 mb-1">Share this link:</p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all font-mono text-sm"
                  >
                    {result.url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.url);
                    alert('Copied to clipboard!');
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Copy Link
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Paste'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Created pastes are stored securely and can be accessed via the shared link.</p>
        </div>
      </div>
    </div>
  );
}
