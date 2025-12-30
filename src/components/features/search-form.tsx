'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type SearchFormProps = {
  className?: string;
};

export function SearchForm({ className }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.set('keyword', keyword.trim());
    }
    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="キーワードを入力（例：IT導入、設備投資）"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <Search className="h-4 w-4 mr-2" />
          検索
        </Button>
      </div>
    </form>
  );
}
