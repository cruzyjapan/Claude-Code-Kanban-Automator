# 差し戻し・再実行のテストガイド

## 実装された機能

### 1. バージョン管理
- タスクが差し戻されるたびに`version`がインクリメント
- 新しい実行は新しいバージョンで行われる

### 2. 出力ファイルのアーカイブ
- 前回の実行結果は自動的にアーカイブされる
- アーカイブディレクトリ: `{task-id}_v{version}_{timestamp}`
- prompt.mdは保持され、他のファイルはアーカイブに移動

### 3. APIエンドポイント
- `POST /api/tasks/{id}/reject`: 差し戻し（バージョンアップ + requested状態に変更）
- フィードバック追加 + 差し戻し処理が連動

## テスト手順

### 1. 初回実行のテスト
```bash
# タスクを実行状態にする
node scripts/request-task.js T-1752707631562-z4fe9frth

# 実行完了を待つ（バックエンドログで確認）
# 出力ファイルを確認
ls -la claude-code-workspace/T-1752707631562-z4fe9frth/
```

### 2. 差し戻し・再実行のテスト

#### UIから：
1. タスク詳細ページを開く
2. タスクが「Review」状態であることを確認
3. 「差戻して再作業」ボタンをクリック
4. フィードバックを入力（例: "出力形式を変更してください"）
5. 自動的に再実行が開始される

#### APIから：
```bash
# フィードバックを追加
curl -X POST http://localhost:5000/api/feedbacks \
  -H "Content-Type: application/json" \
  -d '{"task_id":"T-1752707631562-z4fe9frth","content":"修正をお願いします"}'

# タスクを差し戻し（バージョンアップ + 再実行）
curl -X POST http://localhost:5000/api/tasks/T-1752707631562-z4fe9frth/reject
```

### 3. 確認ポイント

#### データベース確認
```bash
node scripts/check-db.js
```
- バージョンが増加していること

#### ワークスペース確認
```bash
ls -la claude-code-workspace/
```
- 元のディレクトリ: 新しい実行結果
- アーカイブディレクトリ: 前回の実行結果

#### ログ確認
バックエンドログで以下を確認：
- `[ClaudeCodeExecutor] Starting execution for task {id} (version: X)`
- `[ClaudeCodeExecutor] Archiving previous outputs to: ...`
- `[ClaudeCodeExecutor] Archived: {filename}`

### 4. 期待される動作

#### 初回実行（version: 1）
```
claude-code-workspace/T-1752707631562-z4fe9frth/
├── prompt.md
└── output_20250717_092930.txt
```

#### 差し戻し後の再実行（version: 2）
```
claude-code-workspace/
├── T-1752707631562-z4fe9frth/           # 新しい実行結果
│   ├── prompt.md
│   └── output_20250717_093145.txt
└── T-1752707631562-z4fe9frth_v1_1752712345678/  # アーカイブ
    └── output_20250717_092930.txt
```

#### プロンプトファイルの内容
再実行時のprompt.mdには前回のフィードバックが含まれる：
```markdown
# タスク: TEST

## 説明
TEST

## フィードバック
- 出力形式を変更してください
```

## トラブルシューティング

### アーカイブが作成されない
- ワークディレクトリの権限を確認
- バックエンドログでエラーを確認

### バージョンが更新されない
- APIエンドポイント `/tasks/{id}/reject` を使用しているか確認
- 直接ステータス更新では バージョンは増加しない

### 古いファイルが残る
- アーカイブ処理のエラーを確認
- 手動でクリーンアップ: `rm -rf claude-code-workspace/T-*/`