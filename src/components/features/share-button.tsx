'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Share2, Link2, Twitter, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShareButtonProps = {
  title: string;
  text?: string;
  className?: string;
};

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text || `${title} - 補助金ナビ`,
          url: url,
        });
        setIsOpen(false);
      } catch (err) {
        // ユーザーがキャンセルした場合は何もしない
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleTwitterShare = () => {
    const url = getShareUrl();
    const tweetText = encodeURIComponent(`${title}\n\n#補助金 #助成金 #補助金ナビ`);
    const tweetUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
    setIsOpen(false);
  };

  const handleLineShare = () => {
    const url = getShareUrl();
    const lineText = encodeURIComponent(`${title}\n${url}`);
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${lineText}`,
      '_blank',
      'noopener,noreferrer'
    );
    setIsOpen(false);
  };

  // Web Share APIがサポートされている場合は直接シェア
  const supportsNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("bg-white/80", className)}
          onClick={(e) => {
            // モバイルでネイティブシェアがサポートされている場合は直接シェア
            if (supportsNativeShare && window.innerWidth < 768) {
              e.preventDefault();
              handleNativeShare();
            }
          }}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            シェア
          </p>
          
          {/* URLをコピー */}
          <Button
            variant="ghost"
            className="w-full justify-start h-10"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-500" />
                コピーしました！
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                URLをコピー
              </>
            )}
          </Button>

          {/* Twitter */}
          <Button
            variant="ghost"
            className="w-full justify-start h-10"
            onClick={handleTwitterShare}
          >
            <Twitter className="h-4 w-4 mr-2" />
            X (Twitter)
          </Button>

          {/* LINE */}
          <Button
            variant="ghost"
            className="w-full justify-start h-10"
            onClick={handleLineShare}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            LINE
          </Button>

          {/* ネイティブシェア（デスクトップでも表示） */}
          {supportsNativeShare && (
            <Button
              variant="ghost"
              className="w-full justify-start h-10"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              その他のアプリ
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}



