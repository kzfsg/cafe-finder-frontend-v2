import { type ReactNode } from 'react';

interface MasonryGridProps {
  children: ReactNode;
}

export default function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <div className="masonry-grid">
      {children}
    </div>
  );
}
