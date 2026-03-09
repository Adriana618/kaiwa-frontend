'use client';

import { useState } from 'react';

interface CardImageProps {
  imageUrl: string | undefined | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  unsplash?: { photographer?: string; photographer_url?: string } | null;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: 'h-24 w-24',
  md: 'h-40 w-full max-w-xs',
  lg: 'h-56 w-full max-w-md',
};

export default function CardImage({ imageUrl, alt = '', size = 'md', unsplash, onClick }: CardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!imageUrl || error) {
    return null;
  }

  // Resolve URL: if relative, prepend API base
  const resolvedUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${imageUrl}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${SIZE_MAP[size]} relative rounded-xl overflow-hidden bg-surface border border-border ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-surface-hover" />
        )}
        <img
          src={resolvedUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      {unsplash?.photographer && (
        <p className="text-[10px] text-muted/50">
          Photo by{' '}
          <a
            href={`${unsplash.photographer_url}?utm_source=kaiwa&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {unsplash.photographer}
          </a>{' '}
          on{' '}
          <a
            href="https://unsplash.com/?utm_source=kaiwa&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Unsplash
          </a>
        </p>
      )}
    </div>
  );
}
