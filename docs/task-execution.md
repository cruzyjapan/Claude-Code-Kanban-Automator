# タスク実行ガイド / Task Execution Guide

## タスクを実行する方法 / How to Execute Tasks

### 方法1: カンバンボードでドラッグ＆ドロップ
1. ダッシュボードでタスクカードを見つける
2. タスクを「Requested」列にドラッグ
3. 自動的に実行が開始される

### 方法2: タスク詳細ページから実行
1. タスクカードをクリックして詳細ページを開く
2. 「実行」ボタンをクリック
3. タスクが「Requested」状態になり、実行が開始される

### 方法3: APIから直接実行
```bash
curl -X POST http://localhost:5000/api/tasks/{task-id}/execute
```

## 実行の仕組み

1. **タスク実行モニター**
   - 5秒ごとに「requested」状態のタスクをチェック
   - 優先度順に実行（高 > 中 > 低）
   - 最大同時実行数: 3タスク（設定可能）

2. **実行プロセス**
   - `requested` → `working`: 実行開始
   - `working` → `review`: 実行完了、レビュー待ち
   - `review` → `completed`: 承認して完了
   - `review` → `requested`: 差戻して再実行

## トラブルシューティング

### タスクが実行されない場合

1. **バックエンドログを確認**
   ```
   Found X tasks to execute, running Y
   Starting execution of task: ...
   ```

2. **タスクのステータスを確認**
   - ステータスが「requested」になっているか
   - データベースで確認:
   ```bash
   node scripts/check-db.js
   ```

3. **Claude Code設定を確認**
   ```bash
   cat .env | grep CLAUDE_CODE
   ```
   - `CLAUDE_CODE_COMMAND`: 実行コマンドのパス
   - `CLAUDE_CODE_WORK_DIR`: 作業ディレクトリ

4. **タスク実行モニターが動作しているか確認**
   - バックエンドログに「Task execution monitor started」が表示されているか
   - `TASK_CHECK_INTERVAL`が適切な値になっているか（デフォルト: 5000ms）

### 実行エラーの場合

1. **実行ログを確認**
   - タスク詳細ページの「実行ログ」タブ
   - エラーメッセージが表示される

2. **ワークスペースを確認**
   ```bash
   ls -la claude-code-workspace/
   ```
   - タスクIDのディレクトリが作成されているか
   - prompt.mdファイルが存在するか

3. **モックスクリプトをテスト**
   ```bash
   ./scripts/mock-claude-code.sh test.md
   ```

## 設定の調整

### .envファイルで調整可能な項目

```env
# タスクチェック間隔（ミリ秒）
TASK_CHECK_INTERVAL=5000

# 最大同時実行数
MAX_CONCURRENT_TASKS=3

# Claude Codeコマンド（本番環境）
CLAUDE_CODE_COMMAND=claude-code

# モックスクリプト（テスト環境）
CLAUDE_CODE_COMMAND=./scripts/mock-claude-code.sh
```

### 本番環境でClaude Codeを使用する場合

1. Claude Codeがインストールされていることを確認
2. .envファイルを更新:
   ```
   CLAUDE_CODE_COMMAND=claude-code
   ```
3. バックエンドを再起動

## ログの場所

- **バックエンドコンソール**: リアルタイムの実行状況
- **データベース**: executionsテーブルに実行履歴
- **ワークスペース**: claude-code-workspace/<task-id>/に出力ファイル