## 補助金ナビ（hojokin-navi）

全国の補助金・助成金を検索し、保存・通知できる Next.js アプリです（DB は Supabase）。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 環境変数（必須）

Supabase を使うため、最低限次の環境変数が必要です（未設定だとビルド/実行時にエラーになります）。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

テンプレートは `env.local.example` にあります。ローカルでは以下のようにコピーして値を埋めてください。

```bash
cp env.local.example .env.local
```

## Vercel にデプロイする場合

Vercel の **Project Settings → Environment Variables** に上記の必須変数を設定してください。

- `Production` だけでなく、Preview デプロイも使うなら `Preview` にも同じ値を設定するのがおすすめです
- Cron（`/api/cron/deadline-alerts`）を使う場合は `CRON_SECRET` とメール送信用の `RESEND_API_KEY` も設定してください

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
