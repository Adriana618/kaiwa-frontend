'use client';

import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

interface UnsplashPhoto {
  id: string;
  url_small: string;
  url_thumb: string;
  url_regular: string;
  alt: string;
  photographer: string;
  photographer_url: string;
}

interface ImageSearchProps {
  cardId: string;
  initialQuery?: string;
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}

export default function ImageSearch({ cardId, initialQuery = '', onSelect, onClose }: ImageSearchProps) {
  const { token } = useAppStore();
  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [tab, setTab] = useState<'search' | 'upload'>('search');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    if (!token || !query.trim()) return;
    setLoading(true);
    try {
      const results = await api.searchImages(token, query.trim());
      setPhotos(results);
    } catch {
      // API error
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  const handleSelect = useCallback(async (photo: UnsplashPhoto) => {
    if (!token) return;
    setAssigning(photo.id);
    try {
      const result = await api.assignImageDirect(token, cardId, {
        photo_url: photo.url_small,
        photo_id: photo.id,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
      });
      onSelect(result.image_url);
    } catch {
      onSelect(photo.url_small);
    } finally {
      setAssigning(null);
    }
  }, [token, cardId, onSelect]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setAssigning('upload');
    try {
      const result = await api.uploadImage(token, cardId, file);
      onSelect(result.image_url);
    } catch {
      // Upload error
    } finally {
      setAssigning(null);
    }
  }, [token, cardId, onSelect]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium">Card Image</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground text-lg">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('search')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'search' ? 'text-accent border-b-2 border-accent' : 'text-muted'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'upload' ? 'text-accent border-b-2 border-accent' : 'text-muted'
            }`}
          >
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'search' ? (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search images..."
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Search'}
                </button>
              </div>

              {/* Results grid */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelect(photo)}
                      disabled={assigning !== null}
                      className="relative rounded-lg overflow-hidden border border-border hover:border-accent transition-colors aspect-square group"
                    >
                      <img
                        src={photo.url_thumb}
                        alt={photo.alt}
                        className="w-full h-full object-cover"
                      />
                      {assigning === photo.id && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs">Assigning...</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-white truncate">{photo.photographer}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !loading ? (
                <p className="text-muted text-xs text-center py-8">
                  Search for images on Unsplash
                </p>
              ) : (
                <div className="flex justify-center py-8">
                  <p className="text-muted text-xs">Searching...</p>
                </div>
              )}

              {photos.length > 0 && (
                <p className="text-[10px] text-muted/50 text-center">
                  Photos by{' '}
                  <a href="https://unsplash.com/?utm_source=kaiwa&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline">
                    Unsplash
                  </a>
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center">
                <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 4v16m-8-8h16" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-muted">Upload your own image</p>
              <p className="text-xs text-muted/70">JPG, PNG, or WebP (max 5MB)</p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={assigning !== null}
                className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {assigning === 'upload' ? 'Uploading...' : 'Choose File'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
