# スタートアップガイド / Startup Guide

## 推奨起動方法 / Recommended Startup Method

### 新しい統合起動スクリプト（推奨）
```bash
npm run dev
```

これにより：
- 自動的にバックエンドとフロントエンドが起動
- プロセスの管理が簡単
- ログが色分けされて表示
- Ctrl+Cで両方のサーバーが停止

### プロセスをクリーンアップして再起動
```bash
npm run restart
```

## 従来の起動手順 / Traditional Startup Method

### 1. ターミナル1 - バックエンド / Terminal 1 - Backend
```bash
cd backend
npm run dev
```

確認 / Verify:
- "🚀 Server is running on http://localhost:5001" が表示される
- "🤖 Task execution monitor started" が表示される

### 2. ターミナル2 - フロントエンド / Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

確認 / Verify:
- "VITE v5.4.19 ready" が表示される
- "Local: http://localhost:5173/" が表示される

### 3. ブラウザでアクセス / Access in Browser
http://localhost:5173 を開く

## トラブルシューティング / Troubleshooting

### バックエンドが起動しない場合 / If backend doesn't start:

1. ポートを確認 / Check port:
```bash
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
```

2. 環境変数を確認 / Check environment:
```bash
cat .env | grep PORT
# Should show: PORT=5001
```

3. データベースを確認 / Check database:
```bash
ls -la database/tasks.db
# ファイルが存在することを確認
```

### フロントエンドが接続できない場合 / If frontend can't connect:

1. フロントエンドの環境変数を確認 / Check frontend env:
```bash
cat frontend/.env
# Should show:
# VITE_API_URL=http://localhost:5001/api
# VITE_WS_URL=ws://localhost:5001
```

2. APIをテスト / Test API:
```bash
curl http://localhost:5001/health
# Should return JSON with status: "ok"
```

### タスクが実行されない場合 / If tasks don't execute:

1. タスクステータスを確認 / Check task status:
- タスクのステータスが「requested」になっているか確認
- ダッシュボードでタスクカードを「Requested」列にドラッグ

2. 実行ログを確認 / Check execution logs:
- バックエンドのターミナルで "Starting execution of task:" メッセージを確認

3. Claude Codeの設定を確認 / Check Claude Code config:
```bash
cat .env | grep CLAUDE_CODE_COMMAND
# モックスクリプトのパスが正しいか確認
```

## 正常動作の確認 / Verify Normal Operation

1. タスクを作成 / Create a task:
   - "Create Task" ボタンをクリック
   - タイトルと説明を入力
   - Submit

2. タスクを実行 / Execute task:
   - タスクカードを「Requested」列にドラッグ
   - バックエンドのログで実行開始を確認
   - タスクが自動的に「Working」→「Review」に移動

3. WebSocket接続を確認 / Check WebSocket:
   - ブラウザの開発者ツールでNetworkタブを開く
   - ws://localhost:5001 への接続を確認

## 開発時の推奨設定 / Recommended Development Setup

1. VSCodeの統合ターミナルを使用
2. 分割ターミナルでバックエンドとフロントエンドを同時に表示
3. ブラウザの開発者ツールを開いてエラーを監視

## ログの場所 / Log Locations

- バックエンドログ: ターミナル出力
- フロントエンドログ: ブラウザのコンソール
- 実行ログ: claude-code-workspace/<task-id>/ ディレクトリ内