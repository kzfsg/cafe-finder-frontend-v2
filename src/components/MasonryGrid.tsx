import { type ReactNode, Children, useMemo } from 'react';

interface MasonryGridProps {
  children: ReactNode;
  columns?: number;
}

export default function MasonryGrid({ children, columns = 3 }: MasonryGridProps) {
  // Convert children to array
  const childrenArray = Children.toArray(children);
  
  // Distribute children into columns using a smarter algorithm
  // that tries to balance column heights
  const columnGroups = useMemo(() => {
    // Create array of column arrays
    const groups: ReactNode[][] = Array.from({ length: columns }, () => []);
    const columnHeights = Array(columns).fill(0);
    
    // Distribute children to the shortest column first
    // This creates a more balanced masonry layout
    childrenArray.forEach((child) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Add child to the shortest column
      groups[shortestColumnIndex].push(child);
      
      // Update the column height (just add 1 for each item as an approximation)
      // In a real-world scenario with known image dimensions, we could be more precise
      columnHeights[shortestColumnIndex] += 1;
    });
    
    return groups;
  }, [children, columns]);
  
  return (
    <div className="masonry-container">
      {columnGroups.map((columnChildren, columnIndex) => (
        <div key={columnIndex} className="masonry-column">
          {columnChildren.map((child, childIndex) => (
            <div 
              key={childIndex} 
              className="masonry-item"
              // Add a small random variation to create more visual interest
              style={{ 
                transform: `scale(${0.98 + Math.random() * 0.04})`,
                transformOrigin: 'center top'
              }}
            >
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
