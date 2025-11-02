# 環境定義書
各環境での利用情報やツールなどの情報を記載

## 環境設定ファイル構成

### 環境ごとの設定分離
バックエンドアプリケーションは環境変数`ENVIRONMENT`により、適切な設定ファイルを自動的に読み込みます。

#### ファイル構成
```
backend/
├── .env                 # 共通のデフォルト設定
├── .env.development    # 開発環境用設定
├── .env.staging        # ステージング環境用設定
├── .env.production     # 本番環境用設定
└── .env.example        # テンプレート
```

#### 設定の優先順位（高→低）
1. **OS環境変数** - 最優先（個別に設定された環境変数）
2. **.env.{環境}** - 環境固有の設定（.envを上書き）
3. **.env** - 共通のデフォルト設定

#### 環境の切り替え方法
```bash
# 開発環境（デフォルト）
python main.py  # ENVIRONMENTが未設定の場合は自動的にdevelopment

# ステージング環境
export ENVIRONMENT=staging
python main.py

# 本番環境
export ENVIRONMENT=production
python main.py

# Docker Compose使用時
ENVIRONMENT=production docker-compose up
```

#### 環境判定ロジック
- `ENVIRONMENT`環境変数が未設定の場合: `development`として扱う
- 環境固有ファイルが存在しない場合: `.env`ファイルのみを使用
- 両方のファイルが存在する場合: 両方を読み込み、環境固有の設定で上書き

### DB
- HOST名: muraseki.db
- ポート番号: 5432
- DB名: jitan
- ユーザ名: muraseki
- パスワード: muraseki
