// チェックポイントマネージャー

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  CrawlCheckpoint,
  CheckpointSummary,
  CheckpointConfig,
  CrawlerConfig,
  CrawlStats,
  CrawlError,
  UrlQueueItem,
} from '../types';
import type { ScrapedSubsidy } from '../../scrapers/types';

const DEFAULT_CHECKPOINT_CONFIG: CheckpointConfig = {
  savePath: '.crawl-checkpoints',
  saveInterval: 60000,  // 1分
  autoSave: true,
};

export class CheckpointManager {
  private config: CheckpointConfig;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private currentCheckpointId: string | null = null;

  constructor(config?: Partial<CheckpointConfig>) {
    this.config = { ...DEFAULT_CHECKPOINT_CONFIG, ...config };
  }

  // チェックポイントを保存
  async save(checkpoint: CrawlCheckpoint): Promise<void> {
    const filePath = this.getCheckpointPath(checkpoint.id);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });

    const data = {
      ...checkpoint,
      updatedAt: new Date(),
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[CheckpointManager] Saved checkpoint: ${checkpoint.id}`);
  }

  // チェックポイントを読み込み
  async load(id: string): Promise<CrawlCheckpoint | null> {
    const filePath = this.getCheckpointPath(id);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // 日付を復元
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        results: {
          ...data.results,
          stats: {
            ...data.results.stats,
            startTime: new Date(data.results.stats.startTime),
            endTime: data.results.stats.endTime ? new Date(data.results.stats.endTime) : undefined,
          },
        },
        state: {
          ...data.state,
          queuedItems: data.state.queuedItems.map((item: UrlQueueItem) => ({
            ...item,
            addedAt: new Date(item.addedAt),
          })),
        },
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  // チェックポイント一覧を取得
  async list(): Promise<CheckpointSummary[]> {
    const dir = this.config.savePath;

    try {
      const files = await fs.readdir(dir);
      const summaries: CheckpointSummary[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const data = JSON.parse(content);

          summaries.push({
            id: data.id,
            name: data.name,
            visitedCount: data.state.visitedUrls.length,
            queuedCount: data.state.queuedItems.length,
            subsidiesCount: data.results.subsidies.length,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          });
        } catch {
          // 読み込みエラーは無視
        }
      }

      // 更新日時でソート
      return summaries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // チェックポイントを削除
  async delete(id: string): Promise<boolean> {
    const filePath = this.getCheckpointPath(id);

    try {
      await fs.unlink(filePath);
      console.log(`[CheckpointManager] Deleted checkpoint: ${id}`);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  // 自動保存を開始
  startAutoSave(
    getState: () => {
      config: CrawlerConfig;
      visitedUrls: string[];
      queuedItems: UrlQueueItem[];
      currentDepth: number;
      subsidies: ScrapedSubsidy[];
      stats: CrawlStats;
      errors: CrawlError[];
    },
    name: string
  ): string {
    if (!this.config.autoSave) {
      return '';
    }

    // チェックポイントIDを生成
    const id = this.generateCheckpointId(name);
    this.currentCheckpointId = id;

    // 初回保存
    this.saveFromState(id, name, getState);

    // 定期保存を開始
    this.autoSaveTimer = setInterval(() => {
      this.saveFromState(id, name, getState);
    }, this.config.saveInterval);

    console.log(`[CheckpointManager] Auto-save started: ${id} (interval: ${this.config.saveInterval}ms)`);
    return id;
  }

  // 自動保存を停止
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log(`[CheckpointManager] Auto-save stopped`);
    }
  }

  // 現在のチェックポイントIDを取得
  getCurrentCheckpointId(): string | null {
    return this.currentCheckpointId;
  }

  // 状態からチェックポイントを保存
  private async saveFromState(
    id: string,
    name: string,
    getState: () => {
      config: CrawlerConfig;
      visitedUrls: string[];
      queuedItems: UrlQueueItem[];
      currentDepth: number;
      subsidies: ScrapedSubsidy[];
      stats: CrawlStats;
      errors: CrawlError[];
    }
  ): Promise<void> {
    try {
      const state = getState();

      const checkpoint: CrawlCheckpoint = {
        id,
        name,
        config: state.config,
        state: {
          visitedUrls: state.visitedUrls,
          queuedItems: state.queuedItems,
          currentDepth: state.currentDepth,
        },
        results: {
          subsidies: state.subsidies,
          stats: state.stats,
          errors: state.errors,
        },
        createdAt: new Date(), // 初回作成時刻は保持されるべきだが、簡略化
        updatedAt: new Date(),
      };

      await this.save(checkpoint);
    } catch (error) {
      console.error('[CheckpointManager] Auto-save failed:', error);
    }
  }

  // チェックポイントIDを生成
  private generateCheckpointId(name: string): string {
    const timestamp = Date.now().toString(36);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
    return `${safeName}-${timestamp}`;
  }

  // チェックポイントのファイルパスを取得
  private getCheckpointPath(id: string): string {
    return path.join(this.config.savePath, `${id}.json`);
  }

  // 古いチェックポイントをクリーンアップ
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const summaries = await this.list();
    const now = Date.now();
    let deletedCount = 0;

    for (const summary of summaries) {
      const age = now - summary.updatedAt.getTime();
      if (age > maxAge) {
        if (await this.delete(summary.id)) {
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[CheckpointManager] Cleaned up ${deletedCount} old checkpoints`);
    }

    return deletedCount;
  }
}

// シングルトンインスタンス
let checkpointManagerInstance: CheckpointManager | null = null;

export function getCheckpointManager(config?: Partial<CheckpointConfig>): CheckpointManager {
  if (!checkpointManagerInstance) {
    checkpointManagerInstance = new CheckpointManager(config);
  }
  return checkpointManagerInstance;
}

export function resetCheckpointManager(): void {
  if (checkpointManagerInstance) {
    checkpointManagerInstance.stopAutoSave();
  }
  checkpointManagerInstance = null;
}
