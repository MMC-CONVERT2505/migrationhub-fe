import { useState, useEffect, useCallback, useRef } from 'react';
import { DATA_CATEGORIES } from '@/constants/pairs';
import { useAppStore } from '@/store/appStore';

export interface CategoryProgress {
  index: number;
  progress: number;
  status: 'queued' | 'running' | 'done';
  records: number;
}

export function useMigrationProgress(selectedCategories: number[]) {
  const completeMigration = useAppStore((s) => s.completeMigration);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>(() =>
    selectedCategories.map((idx) => ({
      index: idx,
      progress: 0,
      status: 'queued' as const,
      records: DATA_CATEGORIES[idx].estimatedRecords,
    }))
  );
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(currentCategoryIdx);
  currentRef.current = currentCategoryIdx;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setAllDone(true);
      return;
    }

    // Mark first category as running
    setCategoryProgress((prev) =>
      prev.map((cp, i) => (i === 0 ? { ...cp, status: 'running' } : cp))
    );

    const TICK_MS = 120;
    const INCREMENT = 4; // percent per tick

    intervalRef.current = setInterval(() => {
      const curr = currentRef.current;

      setCategoryProgress((prev) => {
        const updated = [...prev];
        const item = updated[curr];
        if (!item) return prev;

        if (item.progress >= 100) {
          // Mark current as done, advance to next
          updated[curr] = { ...item, progress: 100, status: 'done' };
          const next = curr + 1;
          if (next < updated.length) {
            updated[next] = { ...updated[next], status: 'running' };
            setCurrentCategoryIdx(next);
          } else {
            // All done
            clearTimer();
            setAllDone(true);
            completeMigration();
          }
          return updated;
        }

        updated[curr] = {
          ...item,
          progress: Math.min(item.progress + INCREMENT, 100),
        };
        return updated;
      });
    }, TICK_MS);

    return clearTimer;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const overallProgress =
    categoryProgress.reduce((sum, cp) => sum + cp.progress, 0) /
    Math.max(categoryProgress.length, 1);

  return { categoryProgress, overallProgress, allDone };
}
