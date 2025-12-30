// PDF抽出

import type { PdfExtractionResult, ExtractedSubsidyInfo, PdfConfig } from '../types';
import { SUBSIDY_EXTRACTION } from '../config';

const DEFAULT_PDF_CONFIG: PdfConfig = {
  enabled: false,
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  timeout: 30000,  // 30秒
};

export class PdfExtractor {
  private config: PdfConfig;
  private pdfParseLoaded = false;

  constructor(config?: Partial<PdfConfig>) {
    this.config = { ...DEFAULT_PDF_CONFIG, ...config };
  }

  // PDFからテキストを抽出
  async extract(pdfUrl: string): Promise<PdfExtractionResult | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      // PDFをダウンロード
      const buffer = await this.download(pdfUrl);
      if (!buffer) {
        return null;
      }

      // pdf-parseを動的インポート
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');

      // テキスト抽出
      const parsed = await pdfParse(buffer) as { text: string; numpages: number };
      const text = parsed.text;
      const pageCount = parsed.numpages;

      // 画像のみのPDFか判定
      const isImageOnly = this.isImageOnlyPdf(text);

      // 補助金情報抽出
      let subsidy: ExtractedSubsidyInfo | null = null;
      if (!isImageOnly && text.length > 100) {
        subsidy = this.extractSubsidyInfo(text, pdfUrl);
      }

      return {
        url: pdfUrl,
        text: text.slice(0, 10000),  // 最初の10000文字のみ保持
        pageCount,
        subsidy,
        isImageOnly,
      };
    } catch (error) {
      console.warn(`[PdfExtractor] Error extracting ${pdfUrl}:`, error);
      return null;
    }
  }

  // PDFをダウンロード
  private async download(url: string): Promise<Buffer | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      // ファイルサイズチェック
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.config.maxFileSize) {
        console.log(`[PdfExtractor] File too large: ${contentLength} bytes`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.warn(`[PdfExtractor] Download failed for ${url}:`, error);
      return null;
    }
  }

  // 画像のみのPDFか判定
  private isImageOnlyPdf(text: string): boolean {
    // 意味のあるテキストがほとんどない場合は画像PDF
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    if (cleanedText.length < 50) {
      return true;
    }

    // 日本語文字があるか
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(cleanedText);
    if (!hasJapanese && cleanedText.length < 200) {
      return true;
    }

    return false;
  }

  // 補助金情報を抽出
  private extractSubsidyInfo(text: string, url: string): ExtractedSubsidyInfo | null {
    // 補助金関連キーワードがあるかチェック
    let matchCount = 0;
    for (const indicator of SUBSIDY_EXTRACTION.subsidyIndicators) {
      if (text.includes(indicator)) {
        matchCount++;
      }
    }

    if (matchCount < 2) {
      return null;
    }

    // タイトル抽出（最初の行から）
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let title: string | null = null;

    for (const line of lines.slice(0, 10)) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        // 補助金関連キーワードを含む行をタイトルとする
        for (const indicator of SUBSIDY_EXTRACTION.subsidyIndicators) {
          if (trimmed.includes(indicator)) {
            title = trimmed;
            break;
          }
        }
        if (title) break;
      }
    }

    if (!title) {
      // フォールバック: 最初の意味のある行
      for (const line of lines.slice(0, 5)) {
        const trimmed = line.trim();
        if (trimmed.length > 10 && trimmed.length < 100) {
          title = trimmed;
          break;
        }
      }
    }

    if (!title) {
      return null;
    }

    // 金額抽出
    let maxAmount: number | undefined;
    for (const pattern of SUBSIDY_EXTRACTION.amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const unit = match[2];
        let amount = parseFloat(numStr);

        if (unit === '億') {
          amount *= 100000000;
        } else if (unit === '万') {
          amount *= 10000;
        }

        if (amount > 0 && amount < 100000000000) {
          maxAmount = amount;
          break;
        }
      }
    }

    // 締切抽出
    let endDate: string | undefined;
    for (const pattern of SUBSIDY_EXTRACTION.deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        endDate = match[1] || match[0];
        break;
      }
    }

    // 補助率抽出
    let subsidyRate: string | undefined;
    for (const pattern of SUBSIDY_EXTRACTION.subsidyRatePatterns) {
      const match = text.match(pattern);
      if (match) {
        subsidyRate = match[1];
        break;
      }
    }

    // 信頼度計算
    let confidence = 30;  // PDFベースなので低めから開始
    if (maxAmount) confidence += 20;
    if (endDate) confidence += 15;
    if (subsidyRate) confidence += 15;
    if (title.length > 20) confidence += 10;

    return {
      title,
      sourceUrl: url,
      max_amount: maxAmount,
      end_date: endDate,
      subsidy_rate: subsidyRate,
      description: text.slice(0, 500),
      rawText: text.slice(0, 2000),
      confidence: Math.min(100, confidence),
    };
  }

  // 設定を更新
  updateConfig(config: Partial<PdfConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // PDFか判定
  static isPdfUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.toLowerCase().endsWith('.pdf');
    } catch {
      return url.toLowerCase().endsWith('.pdf');
    }
  }
}

// シングルトンインスタンス
let pdfExtractorInstance: PdfExtractor | null = null;

export function getPdfExtractor(config?: Partial<PdfConfig>): PdfExtractor {
  if (!pdfExtractorInstance) {
    pdfExtractorInstance = new PdfExtractor(config);
  }
  return pdfExtractorInstance;
}

export function resetPdfExtractor(): void {
  pdfExtractorInstance = null;
}
