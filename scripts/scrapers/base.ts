// スクレイパー基底クラスとユーティリティ

import { config } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ScrapedSubsidy, ScraperResult } from './types';
import { cleanDescription } from './clean-description';
import { 
  parseAmount as normalizeAmount, 
  parseDate as normalizeDate,
  parseSubsidyRate as normalizeRate,
  parseDateRange as normalizeDateRange,
  normalizeIndustries,
} from '../normalize';

config({ path: '.env.local' });

export abstract class BaseScraper {
  protected name: string;
  protected supabase: SupabaseClient;

  constructor(name: string) {
    this.name = name;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // 各スクレイパーで実装
  abstract scrape(): Promise<ScrapedSubsidy[]>;

  // 実行＆保存
  async run(): Promise<ScraperResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let subsidies: ScrapedSubsidy[] = [];

    console.log(`[${this.name}] スクレイピング開始...`);

    try {
      subsidies = await this.scrape();
      console.log(`[${this.name}] ${subsidies.length}件取得`);

      // Supabaseに保存
      await this.saveToDatabase(subsidies);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      console.error(`[${this.name}] エラー:`, message);
    }

    return {
      source: this.name,
      success: errors.length === 0,
      count: subsidies.length,
      subsidies,
      errors,
      scrapedAt: startTime.toISOString(),
    };
  }

  // データベースに保存（upsert）
  protected async saveToDatabase(subsidies: ScrapedSubsidy[]): Promise<void> {
    if (subsidies.length === 0) return;

    console.log(`[${this.name}] ${subsidies.length}件をデータベースに保存中...`);

    let successCount = 0;
    let errorCount = 0;

    for (const subsidy of subsidies) {
      // source + source_id でユニークなjgrants_id相当を生成
      const uniqueId = `${subsidy.source}:${subsidy.source_id}`;

      const record = {
        jgrants_id: uniqueId,
        name: subsidy.source_id,
        title: subsidy.title,
        catch_phrase: subsidy.catch_phrase || null,
        description: cleanDescription(subsidy.description) || null,
        target_area: subsidy.target_area,
        target_area_detail: subsidy.target_area_detail || null,
        industry: subsidy.industry || [],
        use_purpose: subsidy.use_purpose || null,
        target_number_of_employees: subsidy.target_number_of_employees || null,
        max_amount: subsidy.max_amount || null,
        subsidy_rate: subsidy.subsidy_rate || null,
        start_date: subsidy.start_date || null,
        end_date: subsidy.end_date || null,
        front_url: subsidy.source_url,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from('subsidies')
        .upsert(record, { onConflict: 'jgrants_id' });

      if (error) {
        console.error(`  エラー: ${subsidy.title.slice(0, 30)}...`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(`[${this.name}] 保存完了: 成功${successCount}件, エラー${errorCount}件`);
  }

  // ユーティリティ: HTML からテキスト抽出
  protected stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ユーティリティ: 金額文字列をパース（正規化関数を使用）
  protected parseAmount(text: string): number | undefined {
    return normalizeAmount(text);
  }

  // ユーティリティ: 日付文字列をパース（正規化関数を使用）
  protected parseDate(text: string): string | undefined {
    return normalizeDate(text);
  }

  // ユーティリティ: 日付範囲をパース
  protected parseDateRange(text: string): { startDate?: string; endDate?: string } {
    return normalizeDateRange(text);
  }

  // ユーティリティ: 補助率をパース
  protected parseRate(text: string): string | undefined {
    return normalizeRate(text);
  }

  // ユーティリティ: 業種を正規化
  protected normalizeIndustry(industries: string[]): string[] {
    return normalizeIndustries(industries);
  }

  // ユーティリティ: スリープ
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ユーティリティ: タイムアウト付きfetch
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SubsidyBot/1.0)',
          ...options.headers,
        },
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ユーティリティ: リトライ付きfetch
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    timeoutMs: number = 30000
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, timeoutMs);
        
        // 5xx エラーの場合はリトライ
        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`  Retry ${attempt}/${maxRetries} for ${url}: HTTP ${response.status}`);
          await this.sleep(1000 * attempt); // 指数バックオフ
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          console.warn(`  Retry ${attempt}/${maxRetries} for ${url}: ${lastError.message}`);
          await this.sleep(1000 * attempt);
        }
      }
    }

    throw lastError || new Error(`Failed after ${maxRetries} retries: ${url}`);
  }
}
