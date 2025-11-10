# Meeting Facilitation PoC - Frontend

AI会議ファシリテーションツールのフロントエンドアプリケーション（Next.js）

## 環境構築

### 1. 依存パッケージのインストール

```bash
cd frontend
npm install
```

### 2. 環境変数の設定

ローカル開発用の環境変数ファイルを作成します:

```bash
# .env.exampleをコピーして.env.localを作成
cp .env.example .env.local
```

**注意**: `.env.local`は必須ではありません。このファイルが存在しない場合、アプリケーションは自動的に以下のように動作します:
- ローカル開発環境 (`localhost`): `http://localhost:8000` にアクセス
- 本番環境: `/backend-api` (Vercelリライト経由でECSバックエンドにプロキシ)

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## API エンドポイントの設定

### 自動切り替え

アプリケーションは実行環境に応じて自動的にAPIエンドポイントを切り替えます:

| 環境 | ホスト名 | APIエンドポイント |
|------|----------|-------------------|
| ローカル開発 | `localhost` または `127.0.0.1` | `http://localhost:8000` |
| 本番環境 | その他 | `/backend-api` |

### 手動設定

環境変数で明示的にエンドポイントを指定することもできます:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## ビルドとデプロイ

### 本番ビルド

```bash
npm run build
```

### 本番環境での起動

```bash
npm start
```

### CodeBuild/CodePipeline での本番デプロイ（ECS）

フロントエンドは AWS CodeBuild/CodePipeline を利用してデプロイします。

- ビルド仕様: `buildspec.fe.yml`
- Dockerfile: `.github/docker/web/Dockerfile`
- ECS へは ECR にプッシュしたイメージを CodePipeline で反映

重要なビルド引数/環境変数（buildspec で指定）:

- `BACKEND_API_URL`: Next.js のリライト先URL（バックエンドALBのフルURL）
  - 例: `https://<backend-alb-dns-name>.ap-northeast-1.elb.amazonaws.com`
  - Next.js の `rewrites` で `/backend-api/*` → `BACKEND_API_URL/*` にプロキシされます（`frontend/next.config.mjs`）。
- `NEXT_PUBLIC_API_URL`: クライアント直叩きのAPIベースURL（相対 `/backend-api` 推奨）

パイプラインの流れ（概略）:

1. CodeBuild が `buildspec.fe.yml` に従い Docker build
2. `--build-arg BACKEND_API_URL` と `--build-arg NEXT_PUBLIC_API_URL` を Dockerfile に注入
3. 生成したイメージを ECR に push、`imagedefinitions.json` を出力
4. CodePipeline が ECS サービスへ新イメージを適用

運用上の注意:

- `BACKEND_API_URL` はバックエンドのALB（ECS/BE）のDNS名を設定してください。
- アカウントIDやリージョンは CodeBuild 内で `aws sts get-caller-identity` を利用し動的取得しています（`buildspec.fe.yml`）。

#### 本番構成（実値）

- バックエンドALB（DNS）: `https://bemac-meeting-fe-alb-1103801797.ap-northeast-1.elb.amazonaws.com`
- フロント公開ドメイン: `https://bemac-meeting.fr-aicompass.com`
- AWSアカウントID: `111938288341`
- ECSクラスタ名: `bemac-fe-cluster`
- サービス名（BE）: `bemac-be-svc`
- サービス名（FE）: `bemac-fe-svc`
- タスク定義名（BE）: `bemac-be-task`
- タスク定義名（FE）: `bemac-fe-task`
- CodeBuildプロジェクト（BE）: `bemac-be-build`
- CodeBuildプロジェクト（FE）: `bemac-fe-build`
- CodePipeline（BE）: `bemac-be-pipeline`
- CodePipeline（FE）: `bemac-fe-pipeline`

> 注記: フロントエンド/バックエンドはいずれも同一ECSクラスタ `bemac-fe-cluster` 上で稼働します。

## バックエンドの起動

フロントエンドを動作させるには、バックエンドAPIサーバーが起動している必要があります。

```bash
cd ../backend
# バックエンドの起動方法については backend/README.md を参照
```

## パフォーマンス最適化

### 初回コンパイル時間の短縮

Next.jsは初回アクセス時にページをコンパイルします。特にMUIを使用しているページは、初回コンパイルに時間がかかります（1分程度）。

**最適化方法:**

1. **ファイルシステムキャッシュを活用する**
   - 2回目以降のコンパイルは高速化されます（キャッシュが有効）
   - `.next/cache` フォルダーを削除しないようにしてください

2. **開発サーバーを再起動する**
   ```bash
   # Ctrl+C で停止
   npm run dev
   ```

3. **事前にページをウォームアップする**
   - 開発サーバー起動直後に、よく使うページにアクセスしてコンパイルしておく
   - 会議作成 → 会議中画面への遷移がスムーズになります

4. **ソースマップを無効化する（既に設定済み）**
   - `.env.development` で `GENERATE_SOURCEMAP=false` に設定済み
   - コンパイル時間が短縮されます

### 実行環境のパフォーマンス

- **推奨スペック**: CPU 4コア以上、メモリ 8GB以上
- メモリ不足の場合は、他のアプリケーションを終了してください

## トラブルシューティング

### API接続エラー

- ローカル開発時にAPIエラーが発生する場合は、バックエンドサーバーが `http://localhost:8000` で起動していることを確認してください
- 本番環境の場合は、`BACKEND_API_URL`（ALB）と `NEXT_PUBLIC_API_URL` が正しく設定されていることを確認してください

### favicon 404エラー

faviconは外部サイト（https://www.bemac-fr.com/favicon.ico）から取得しています。ネットワーク環境によってはCORSエラーが発生する可能性があります。

### コンパイルが遅い

初回アクセス時のコンパイルに1分程度かかることがあります。これは正常な動作です。上記の「パフォーマンス最適化」セクションを参照してください。
