#!/bin/bash

# Mock Claude Code script for testing
# This simulates Claude Code execution

# Check if prompt file was provided
if [ -z "$1" ]; then
    echo "Error: No prompt file provided"
    exit 1
fi

PROMPT_FILE="$1"

# Check if prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: Prompt file not found: $PROMPT_FILE"
    exit 1
fi

echo "=== Mock Claude Code Execution Started ==="
echo "Task ID: $CLAUDE_CODE_TASK_ID"
echo "Working Directory: $(pwd)"
echo "Prompt File: $PROMPT_FILE"
echo ""
echo "=== Prompt Content ==="
cat "$PROMPT_FILE"
echo ""
echo "=== Simulating Execution ==="

# Analyze prompt content and generate appropriate response
PROMPT_CONTENT=$(cat "$PROMPT_FILE")

# Simulate some processing time
sleep 3

# Create output file with timestamp
OUTPUT_FILE="output_$(date +%Y%m%d_%H%M%S).txt"

echo "=== Claude Code実行結果 ===" > "$OUTPUT_FILE"
echo "実行日時: $(date)" >> "$OUTPUT_FILE"
echo "タスクID: $CLAUDE_CODE_TASK_ID" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Generate content based on prompt analysis
if echo "$PROMPT_CONTENT" | grep -qi "SEとは"; then
    echo "## SE（システムエンジニア）について" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "**調査実行日時**: $(date '+%Y年%m月%d日 %H時%M分')" >> "$OUTPUT_FILE"
    echo "**調査方法**: 総合的な文献調査とベストプラクティス分析" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    echo "### 1. 職業の定義" >> "$OUTPUT_FILE"
    echo "SE（Systems Engineer/Software Engineer）は、コンピュータシステムやソフトウェアの設計・開発・運用・保守を担う専門技術者です。" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "**歴史的背景**: 1960年代にコンピュータの普及と共に登場。1980年代以降、情報システムの重要性増大により職種が確立。" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    echo "### 2. 詳細な業務内容" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 上流工程" >> "$OUTPUT_FILE"
    echo "- **要件定義**: ユーザーニーズの聞き取り、機能要件・非機能要件の明確化" >> "$OUTPUT_FILE"
    echo "- **基本設計**: システム全体のアーキテクチャ設計、画面設計、帳票設計" >> "$OUTPUT_FILE"
    echo "- **詳細設計**: モジュール単位での詳細な処理フロー設計" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 開発工程" >> "$OUTPUT_FILE"
    echo "- **プログラミング**: Java、Python、C#、JavaScript等での実装" >> "$OUTPUT_FILE"
    echo "- **単体テスト**: 作成したプログラムの品質確認" >> "$OUTPUT_FILE"
    echo "- **結合テスト**: モジュール間の連携確認" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 運用・保守工程" >> "$OUTPUT_FILE"
    echo "- **システム運用**: 稼働監視、パフォーマンス監視" >> "$OUTPUT_FILE"
    echo "- **障害対応**: 障害発生時の原因調査・復旧作業" >> "$OUTPUT_FILE"
    echo "- **機能追加・改修**: 新機能開発、既存機能の改善" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    echo "### 3. 必要なスキルセット" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 技術スキル" >> "$OUTPUT_FILE"
    echo "- **プログラミング言語**: Java、Python、C#、JavaScript、TypeScript、Go等" >> "$OUTPUT_FILE"
    echo "- **データベース**: MySQL、PostgreSQL、Oracle、SQLServer、NoSQL（MongoDB、Redis）" >> "$OUTPUT_FILE"
    echo "- **インフラ**: AWS、Azure、GCP、Docker、Kubernetes、Linux" >> "$OUTPUT_FILE"
    echo "- **フレームワーク**: Spring、Django、React、Angular、Vue.js" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### ヒューマンスキル" >> "$OUTPUT_FILE"
    echo "- **コミュニケーション**: 顧客折衝、チーム内連携" >> "$OUTPUT_FILE"
    echo "- **プロジェクト管理**: スケジュール管理、リスク管理" >> "$OUTPUT_FILE"
    echo "- **問題解決**: 論理的思考、課題分析能力" >> "$OUTPUT_FILE"
    echo "- **学習継続**: 技術トレンドへの対応、新技術習得" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    echo "### 4. キャリアパスと年収" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 一般的なキャリアパス" >> "$OUTPUT_FILE"
    echo "1. **ジュニアSE（1-3年）**: 400-500万円" >> "$OUTPUT_FILE"
    echo "2. **SE（3-7年）**: 500-700万円" >> "$OUTPUT_FILE"
    echo "3. **シニアSE（7-12年）**: 700-900万円" >> "$OUTPUT_FILE"
    echo "4. **プロジェクトリーダー（8-15年）**: 800-1200万円" >> "$OUTPUT_FILE"
    echo "5. **プロジェクトマネージャー（10年以上）**: 1000-1500万円" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 専門分野への分岐" >> "$OUTPUT_FILE"
    echo "- **システムアーキテクト**: 大規模システム設計の専門家" >> "$OUTPUT_FILE"
    echo "- **データベーススペシャリスト**: DB設計・運用の専門家" >> "$OUTPUT_FILE"
    echo "- **セキュリティエンジニア**: サイバーセキュリティの専門家" >> "$OUTPUT_FILE"
    echo "- **AIエンジニア**: 機械学習・AI開発の専門家" >> "$OUTPUT_FILE"
    echo "- **ITコンサルタント**: IT戦略・企画の専門家" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    echo "### 5. 現在の市場動向と将来性" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 需要の高い分野（2024-2025年）" >> "$OUTPUT_FILE"
    echo "- **クラウドインフラ**: AWS、Azure、GCPのスキル需要増" >> "$OUTPUT_FILE"
    echo "- **AI・機械学習**: Python、TensorFlow、PyTorchの需要急拡大" >> "$OUTPUT_FILE"
    echo "- **セキュリティ**: サイバー攻撃対策の重要性増大" >> "$OUTPUT_FILE"
    echo "- **モバイル開発**: React Native、Flutter等のクロスプラットフォーム開発" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 今後重要になる技術" >> "$OUTPUT_FILE"
    echo "- **マイクロサービス**: 分散システム設計" >> "$OUTPUT_FILE"
    echo "- **DevOps**: CI/CD、インフラ自動化" >> "$OUTPUT_FILE"
    echo "- **エッジコンピューティング**: IoT、リアルタイム処理" >> "$OUTPUT_FILE"
    echo "- **量子コンピューティング**: 次世代計算技術" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    echo "### 6. SEになるための学習方法" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 基礎学習（3-6ヶ月）" >> "$OUTPUT_FILE"
    echo "1. **プログラミング基礎**: Python or Javaから開始" >> "$OUTPUT_FILE"
    echo "2. **データベース基礎**: SQL、正規化理論" >> "$OUTPUT_FILE"
    echo "3. **ネットワーク基礎**: TCP/IP、HTTP/HTTPS" >> "$OUTPUT_FILE"
    echo "4. **OS基礎**: Linux基本コマンド" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "#### 実践学習（6-12ヶ月）" >> "$OUTPUT_FILE"
    echo "1. **フレームワーク習得**: Spring Boot、Django等" >> "$OUTPUT_FILE"
    echo "2. **クラウド実践**: AWS、Azureの基本サービス" >> "$OUTPUT_FILE"
    echo "3. **プロジェクト開発**: GitHubでのポートフォリオ作成" >> "$OUTPUT_FILE"
    echo "4. **チーム開発**: Git、アジャイル開発手法" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # Create detailed technical reference files
    echo "# SE技術スタック詳細資料" > "se_technical_stack.md"
    echo "" >> "se_technical_stack.md"
    echo "## フロントエンド技術" >> "se_technical_stack.md"
    echo "### JavaScript系" >> "se_technical_stack.md"
    echo "- **React**: コンポーネント指向のライブラリ（Meta開発）" >> "se_technical_stack.md"
    echo "- **Vue.js**: プログレッシブフレームワーク（易習得性が特徴）" >> "se_technical_stack.md"
    echo "- **Angular**: 本格的なSPAフレームワーク（Google開発）" >> "se_technical_stack.md"
    echo "- **TypeScript**: 型安全なJavaScript拡張（Microsoft開発）" >> "se_technical_stack.md"
    echo "" >> "se_technical_stack.md"
    echo "## バックエンド技術" >> "se_technical_stack.md"
    echo "### Java系" >> "se_technical_stack.md"
    echo "- **Spring Boot**: エンタープライズ向けフレームワーク" >> "se_technical_stack.md"
    echo "- **Spring Security**: 認証・認可の仕組み" >> "se_technical_stack.md"
    echo "- **MyBatis/JPA**: ORM（Object-Relational Mapping）" >> "se_technical_stack.md"
    echo "" >> "se_technical_stack.md"
    echo "### Python系" >> "se_technical_stack.md"
    echo "- **Django**: 高機能Webフレームワーク" >> "se_technical_stack.md"
    echo "- **FastAPI**: 高速API開発フレームワーク" >> "se_technical_stack.md"
    echo "- **Flask**: 軽量フレームワーク" >> "se_technical_stack.md"
    echo "" >> "se_technical_stack.md"
    echo "## データベース技術" >> "se_technical_stack.md"
    echo "### RDBMS" >> "se_technical_stack.md"
    echo "- **PostgreSQL**: 高機能オープンソースDB" >> "se_technical_stack.md"
    echo "- **MySQL**: 広く使われるオープンソースDB" >> "se_technical_stack.md"
    echo "- **Oracle**: エンタープライズ向け商用DB" >> "se_technical_stack.md"
    echo "" >> "se_technical_stack.md"
    echo "### NoSQL" >> "se_technical_stack.md"
    echo "- **MongoDB**: ドキュメント指向DB" >> "se_technical_stack.md"
    echo "- **Redis**: インメモリKVS" >> "se_technical_stack.md"
    echo "- **Elasticsearch**: 全文検索エンジン" >> "se_technical_stack.md"
    
    # Create career development guide
    echo "# SEキャリア開発ガイド" > "se_career_guide.md"
    echo "" >> "se_career_guide.md"
    echo "## レベル別スキルマップ" >> "se_career_guide.md"
    echo "" >> "se_career_guide.md"
    echo "### レベル1: 新人SE（1-2年目）" >> "se_career_guide.md"
    echo "#### 必須スキル" >> "se_career_guide.md"
    echo "- [ ] プログラミング言語1つ以上の習得" >> "se_career_guide.md"
    echo "- [ ] SQL基本文法の理解" >> "se_career_guide.md"
    echo "- [ ] Git基本操作" >> "se_career_guide.md"
    echo "- [ ] Linux基本コマンド" >> "se_career_guide.md"
    echo "" >> "se_career_guide.md"
    echo "#### 推奨資格" >> "se_career_guide.md"
    echo "- 基本情報技術者試験" >> "se_career_guide.md"
    echo "- Oracle Bronze SQL基礎" >> "se_career_guide.md"
    echo "" >> "se_career_guide.md"
    echo "### レベル2: 中堅SE（3-5年目）" >> "se_career_guide.md"
    echo "#### 必須スキル" >> "se_career_guide.md"
    echo "- [ ] フレームワーク活用能力" >> "se_career_guide.md"
    echo "- [ ] 設計書作成能力" >> "se_career_guide.md"
    echo "- [ ] API設計・開発" >> "se_career_guide.md"
    echo "- [ ] テスト設計・実行" >> "se_career_guide.md"
    echo "- [ ] 後輩指導能力" >> "se_career_guide.md"
    echo "" >> "se_career_guide.md"
    echo "#### 推奨資格" >> "se_career_guide.md"
    echo "- 応用情報技術者試験" >> "se_career_guide.md"
    echo "- AWS Certified Solutions Architect - Associate" >> "se_career_guide.md"
    echo "" >> "se_career_guide.md"
    echo "### レベル3: シニアSE（6年目以上）" >> "se_career_guide.md"
    echo "#### 必須スキル" >> "se_career_guide.md"
    echo "- [ ] システムアーキテクチャ設計" >> "se_career_guide.md"
    echo "- [ ] プロジェクト管理" >> "se_career_guide.md"
    echo "- [ ] 顧客折衝・要件定義" >> "se_career_guide.md"
    echo "- [ ] 技術選定・評価" >> "se_career_guide.md"
    echo "- [ ] チームリーディング" >> "se_career_guide.md"
    echo "" >> "se_career_guide.md"
    echo "#### 推奨資格" >> "se_career_guide.md"
    echo "- データベーススペシャリスト試験" >> "se_career_guide.md"
    echo "- ネットワークスペシャリスト試験" >> "se_career_guide.md"
    echo "- PMP（Project Management Professional）" >> "se_career_guide.md"
    
else
    echo "## タスク実行結果" >> "$OUTPUT_FILE"
    echo "プロンプトの内容を分析し、以下の結果を生成しました：" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "### 入力内容の要約" >> "$OUTPUT_FILE"
    echo "$PROMPT_CONTENT" | head -10 >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "### 実行ステータス" >> "$OUTPUT_FILE"
    echo "- 処理完了" >> "$OUTPUT_FILE"
    echo "- 出力ファイル生成済み" >> "$OUTPUT_FILE"
    echo "- エラーなし" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "=== 実行完了 ===" >> "$OUTPUT_FILE"

echo "Created output file: $OUTPUT_FILE"
echo ""
echo "=== Mock Claude Code Execution Completed ==="

# Exit successfully
exit 0