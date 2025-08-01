import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  estimatedItemHeight?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  estimatedItemHeight = 50
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Calculate item heights and positions
  const getItemHeight = useCallback(
    (index: number) => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // Calculate visible range
  const calculateVisibleRange = useCallback(() => {
    if (!items.length) return { start: 0, end: 0 };

    let accumulatedHeight = 0;
    let start = 0;
    let end = items.length;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // Find end index
    accumulatedHeight = 0;
    for (let i = start; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + height) {
        end = Math.min(items.length, i + overscan);
        break;
      }
      accumulatedHeight += getItemHeight(i);
    }

    return { start, end };
  }, [items.length, scrollTop, height, overscan, getItemHeight]);

  const { start, end } = calculateVisibleRange();

  // Calculate total height
  const totalHeight = items.reduce((acc, _, index) => acc + getItemHeight(index), 0);

  // Calculate offset for visible items
  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight]
  );

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    setIsScrolling(true);
    onScroll?.(scrollTop);

    // Debounce scroll end
    if (scrollRef.current) {
      clearTimeout((scrollRef.current as any).scrollTimeout);
      (scrollRef.current as any).scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }
  }, [onScroll]);

  // Visible items
  const visibleItems = items.slice(start, end);

  return (
    <div
      ref={scrollRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = start + index;
          const offset = getItemOffset(actualIndex);
          const height = getItemHeight(actualIndex);

          return (
            <div
              key={actualIndex}
              style={{
                position: 'absolute',
                top: offset,
                left: 0,
                right: 0,
                height,
                willChange: isScrolling ? 'transform' : 'auto'
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook for measuring dynamic item heights
export function useDynamicItemHeight<T>(
  items: T[],
  estimatedHeight: number = 50
) {
  const heightsRef = useRef<Map<number, number>>(new Map());
  const [, forceUpdate] = useState({});

  const setItemHeight = useCallback((index: number, height: number) => {
    const currentHeight = heightsRef.current.get(index);
    if (currentHeight !== height) {
      heightsRef.current.set(index, height);
      forceUpdate({});
    }
  }, []);

  const getItemHeight = useCallback(
    (index: number) => {
      return heightsRef.current.get(index) || estimatedHeight;
    },
    [estimatedHeight]
  );

  const measureElement = useCallback((element: HTMLElement | null, index: number) => {
    if (element) {
      const height = element.getBoundingClientRect().height;
      setItemHeight(index, height);
    }
  }, [setItemHeight]);

  return {
    getItemHeight,
    measureElement,
    totalHeight: items.reduce((acc, _, index) => acc + getItemHeight(index), 0)
  };
}