#!/usr/bin/env npx tsx

// ディープクローラー実行スクリプト

import { config } from 'dotenv';
import {
  DeepCrawlerScraper,
  DEEP_CRAWL_TARGETS,
  createDeepCrawler,
  createCustomDeepCrawler,
} from './scrapers/deep-crawler';
import { CrawlerEngine, getCheckpointManager } from './crawler';

config({ path: '.env.local' });

async function main() {
  const args = process.argv.slice(2);

  // ヘルプ表示
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // ターゲット一覧表示
  if (args.includes('--list')) {
    printTargets();
    process.exit(0);
  }

  // チェックポイント一覧表示
  if (args.includes('--list-checkpoints')) {
    await listCheckpoints();
    process.exit(0);
  }

  // チェックポイントから再開
  const resumeIndex = args.indexOf('--resume');
  if (resumeIndex !== -1 && args[resumeIndex + 1]) {
    const checkpointId = args[resumeIndex + 1];
    await resumeFromCheckpoint(checkpointId);
    return;
  }

  // キャッシュクリア
  if (args.includes('--clear-cache')) {
    const engine = new CrawlerEngine();
    engine.clearCache();
    console.log('[Cache] Cleared');
    process.exit(0);
  }

  // チェックポイントクリーンアップ
  if (args.includes('--cleanup-checkpoints')) {
    const manager = getCheckpointManager();
    const deleted = await manager.cleanup();
    console.log(`[Checkpoints] Cleaned up ${deleted} old checkpoints`);
    process.exit(0);
  }

  // ドライランモード
  const dryRun = args.includes('--dry-run');
  if (dryRun) {
    console.log('[Mode] Dry run - データベースに保存しません\n');
  }

  // カスタムURL指定
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    const customUrl = args[urlIndex + 1];
    const name = args[args.indexOf('--name') + 1] || 'custom';
    const maxDepth = parseInt(args[args.indexOf('--depth') + 1]) || 3;
    const maxPages = parseInt(args[args.indexOf('--pages') + 1]) || 100;

    console.log(`[Custom] URL: ${customUrl}`);
    console.log(`[Custom] Name: ${name}, Depth: ${maxDepth}, Pages: ${maxPages}\n`);

    const crawler = createCustomDeepCrawler(name, [customUrl], {
      maxDepth,
      maxPages,
      dryRun,
    });

    await runCrawler(crawler, dryRun);
    return;
  }

  // ターゲット指定
  const targetIndex = args.indexOf('--target');
  if (targetIndex !== -1 && args[targetIndex + 1]) {
    const targetName = args[targetIndex + 1];
    const crawler = createDeepCrawler(targetName);

    if (!crawler) {
      console.error(`[Error] Unknown target: ${targetName}`);
      console.log('\nAvailable targets:');
      printTargets();
      process.exit(1);
    }

    if (dryRun) {
      crawler['engine']['config'].dryRun = true;
    }

    await runCrawler(crawler, dryRun);
    return;
  }

  // 全ターゲット実行
  if (args.includes('--all')) {
    console.log(`[All] Running all ${DEEP_CRAWL_TARGETS.length} targets...\n`);

    for (const target of DEEP_CRAWL_TARGETS) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[Target] ${target.displayName} (${target.name})`);
      console.log(`${'='.repeat(60)}\n`);

      const crawler = createDeepCrawler(target.name);
      if (crawler) {
        if (dryRun) {
          crawler['engine']['config'].dryRun = true;
        }
        await runCrawler(crawler, dryRun);
      }
    }

    return;
  }

  // デフォルト: ヘルプ表示
  printHelp();
}

async function runCrawler(crawler: DeepCrawlerScraper, dryRun: boolean) {
  const startTime = Date.now();

  try {
    const result = await crawler.run();

    console.log('\n' + '='.repeat(60));
    console.log('[Results]');
    console.log(`  Source: ${result.source}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Subsidies found: ${result.count}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    if (!dryRun && result.count > 0) {
      console.log(`  Saved to database: Yes`);
    } else if (dryRun && result.count > 0) {
      console.log(`  Saved to database: No (dry run)`);
    }

    if (result.errors.length > 0) {
      console.log('\n[Errors]');
      for (const error of result.errors.slice(0, 5)) {
        console.log(`  - ${error}`);
      }
      if (result.errors.length > 5) {
        console.log(`  ... and ${result.errors.length - 5} more`);
      }
    }

    // サンプル出力
    if (result.subsidies.length > 0) {
      console.log('\n[Sample Subsidies]');
      for (const subsidy of result.subsidies.slice(0, 3)) {
        console.log(`  - ${subsidy.title.slice(0, 60)}...`);
        if (subsidy.max_amount) {
          console.log(`    Amount: ${subsidy.max_amount.toLocaleString()}円`);
        }
        if (subsidy.end_date) {
          console.log(`    Deadline: ${subsidy.end_date}`);
        }
      }
    }

    console.log('='.repeat(60));
  } catch (error) {
    console.error('[Error]', error);
    process.exit(1);
  }
}

async function listCheckpoints() {
  const manager = getCheckpointManager();
  const checkpoints = await manager.list();

  if (checkpoints.length === 0) {
    console.log('No checkpoints found.');
    return;
  }

  console.log('Available checkpoints:\n');
  for (const cp of checkpoints) {
    console.log(`  ${cp.id}`);
    console.log(`    Name: ${cp.name}`);
    console.log(`    Visited: ${cp.visitedCount}, Queued: ${cp.queuedCount}, Subsidies: ${cp.subsidiesCount}`);
    console.log(`    Updated: ${cp.updatedAt.toLocaleString()}`);
    console.log('');
  }
}

async function resumeFromCheckpoint(checkpointId: string) {
  console.log(`[Resume] Resuming from checkpoint: ${checkpointId}\n`);

  const engine = new CrawlerEngine();
  const startTime = Date.now();

  try {
    const result = await engine.resumeCrawl(checkpointId);

    console.log('\n' + '='.repeat(60));
    console.log('[Results]');
    console.log(`  Success: true`);
    console.log(`  Subsidies found: ${result.subsidies.length}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('[Error]', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
ディープクローラー実行スクリプト

Usage:
  npx tsx scripts/run-deep-crawler.ts [options]

Options:
  --help, -h              ヘルプを表示
  --list                  利用可能なターゲット一覧を表示
  --target <name>         指定したターゲットをクロール
  --all                   全ターゲットをクロール
  --url <url>             カスタムURLをクロール
  --name <name>           カスタムクロール時の名前 (default: custom)
  --depth <n>             最大深さ (default: 3)
  --pages <n>             最大ページ数 (default: 100)
  --dry-run               データベースに保存しない

Checkpoint Options:
  --list-checkpoints      チェックポイント一覧を表示
  --resume <id>           チェックポイントから再開
  --cleanup-checkpoints   古いチェックポイントを削除

Cache Options:
  --clear-cache           キャッシュをクリア

Examples:
  # 特定ターゲットをクロール
  npx tsx scripts/run-deep-crawler.ts --target tokyo-kosha

  # カスタムURLをクロール
  npx tsx scripts/run-deep-crawler.ts --url https://example.com/subsidies/ --name example --depth 4

  # ドライラン
  npx tsx scripts/run-deep-crawler.ts --target meti --dry-run

  # 全ターゲット実行
  npx tsx scripts/run-deep-crawler.ts --all

  # チェックポイントから再開
  npx tsx scripts/run-deep-crawler.ts --resume tokyo-kosha-abc123

  # チェックポイント一覧を表示
  npx tsx scripts/run-deep-crawler.ts --list-checkpoints
`);
}

function printTargets() {
  console.log('Available targets:\n');
  for (const target of DEEP_CRAWL_TARGETS) {
    console.log(`  ${target.name.padEnd(15)} - ${target.displayName}`);
    console.log(`    URLs: ${target.entryUrls.join(', ')}`);
    console.log(`    Config: depth=${target.config.maxDepth}, pages=${target.config.maxPages}`);
    console.log('');
  }
}

main().catch(console.error);
