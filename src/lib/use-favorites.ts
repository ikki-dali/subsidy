'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'subsidy-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // 初期化：APIから読み込み、失敗時はlocalStorageにフォールバック
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await fetch('/api/favorites');

        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
          setUseLocalStorage(false);
        } else if (res.status === 401) {
          // 未ログインの場合はlocalStorageを使用
          loadFromLocalStorage();
        } else {
          throw new Error('API error');
        }
      } catch {
        // APIエラーの場合はlocalStorageにフォールバック
        loadFromLocalStorage();
      } finally {
        setIsLoaded(true);
      }
    };

    const loadFromLocalStorage = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
          try {
            setFavorites(JSON.parse(stored));
          } catch {
            setFavorites([]);
          }
        }
        setUseLocalStorage(true);
      }
    };

    loadFavorites();
  }, []);

  // localStorageモードの場合、変更を保存
  useEffect(() => {
    if (isLoaded && useLocalStorage && typeof window !== 'undefined') {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded, useLocalStorage]);

  const isFavorite = useCallback(
    (subsidyId: string) => favorites.includes(subsidyId),
    [favorites]
  );

  const addFavorite = useCallback(async (subsidyId: string) => {
    // 即座にUIを更新
    setFavorites((prev) =>
      prev.includes(subsidyId) ? prev : [...prev, subsidyId]
    );

    // APIに保存（localStorageモードでない場合）
    if (!useLocalStorage) {
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subsidyId }),
        });

        if (!res.ok) {
          // 失敗した場合はロールバック
          setFavorites((prev) => prev.filter((id) => id !== subsidyId));
        }
      } catch {
        // エラー時はロールバック
        setFavorites((prev) => prev.filter((id) => id !== subsidyId));
      }
    }
  }, [useLocalStorage]);

  const removeFavorite = useCallback(async (subsidyId: string) => {
    // 即座にUIを更新
    setFavorites((prev) => prev.filter((id) => id !== subsidyId));

    // APIから削除（localStorageモードでない場合）
    if (!useLocalStorage) {
      try {
        const res = await fetch(`/api/favorites?subsidyId=${subsidyId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          // 失敗した場合はロールバック
          setFavorites((prev) => [...prev, subsidyId]);
        }
      } catch {
        // エラー時はロールバック
        setFavorites((prev) => [...prev, subsidyId]);
      }
    }
  }, [useLocalStorage]);

  const toggleFavorite = useCallback(async (subsidyId: string) => {
    if (favorites.includes(subsidyId)) {
      await removeFavorite(subsidyId);
    } else {
      await addFavorite(subsidyId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  return {
    favorites,
    isLoaded,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
}
