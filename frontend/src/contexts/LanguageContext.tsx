import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'ja' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  ja: {
    // Dashboard
    'dashboard.title': 'Claude Code Kanban Automator',
    
    // Task general
    'task.new': '新規タスク',
    'task.pending': '未対応',
    'task.requested': '作業依頼',
    'task.working': '作業中',
    'task.review': 'レビュー',
    'task.completed': '完了',
    'task.title': 'タイトル',
    'task.description': '説明',
    'task.priority': '優先度',
    'task.priority.high': '高',
    'task.priority.medium': '中',
    'task.priority.low': '低',
    'task.status': 'ステータス',
    'task.created': '作成',
    'task.updated': '更新',
    'task.archive': 'アーカイブ',
    'task.due': '期限',
    'task.rework': '再作業',
    'task.execute': 'Claude Codeに作業を依頼する',
    'task.approve': '承認して完了',
    'task.reject': '差戻して再作業',
    'task.pause': '一時停止',
    'task.id': 'ID',
    'task.version': 'バージョン',
    'task.info': 'タスク情報',
    'task.create.title': '新規タスク作成',
    'task.edit.title': 'タスク編集',
    'task.detail.title': 'タスク詳細',
    'task.not.found': 'タスクが見つかりません',
    'task.back.dashboard': 'ダッシュボードに戻る',
    'task.title.placeholder': 'タスクのタイトルを入力',
    'task.description.placeholder': 'タスクの詳細な説明を入力',
    
    // Task tabs
    'tab.basic.info': '基本情報',
    'tab.execution.logs': '実行ログ',
    'tab.outputs': '成果物',
    'tab.feedback': 'フィードバック',
    'tab.attachments': '添付ファイル',
    
    // Buttons
    'button.save': '保存',
    'button.cancel': 'キャンセル',
    'button.delete': '削除',
    'button.close': '閉じる',
    'button.edit': '編集',
    'button.create': '作成',
    'button.update': '更新',
    
    // Feedback
    'feedback.title': 'フィードバック',
    'feedback.add': 'フィードバックを追加',
    'feedback.send': 'フィードバックを送信',
    'feedback.sending': '送信中...',
    'feedback.placeholder': '修正点や改善要望を記載してください...',
    'feedback.history': 'フィードバック履歴',
    'feedback.empty': 'フィードバックはまだありません',
    'feedback.addressed': '対応済み',
    'feedback.reject.reason': '差戻し理由を入力してください',
    
    // Settings
    'settings.title': '設定',
    'settings.notifications': '通知設定',
    'settings.appearance': '外観',
    'settings.language': '言語',
    'settings.desktop.notifications': 'デスクトップ通知',
    'settings.desktop.notifications.desc': 'ブラウザのデスクトップ通知を表示',
    'settings.sound.notifications': '音声通知',
    'settings.sound.notifications.desc': '通知音を再生',
    'settings.sound.volume': '通知音量',
    'settings.sound.type': '通知音',
    'settings.theme': 'テーマ',
    'settings.theme.desc': '自動モードでは、システムの設定に従ってライト/ダークテーマが切り替わります。',
    
    // Notification types
    'notification.desktop': 'デスクトップ通知',
    'notification.sound': '音声通知',
    'notification.volume': '通知音量',
    'notification.type': '通知音',
    'notification.items': '通知する項目',
    'notification.review.request': 'レビュー依頼',
    'notification.review.request.desc': 'タスクがレビュー待ちになったとき',
    'notification.task.complete': '作業完了',
    'notification.task.complete.desc': 'タスクが完了したとき',
    'notification.error': 'エラー発生',
    'notification.error.desc': 'タスクの実行中にエラーが発生したとき',
    'notification.task.start': '作業開始',
    'notification.task.start.desc': 'タスクの実行が開始されたとき',
    'notification.feedback.complete': 'フィードバック対応',
    'notification.feedback.complete.desc': 'フィードバックへの対応が完了したとき',
    
    // Notification messages
    'notification.task.started.title': 'タスク開始',
    'notification.task.started.message': '{0} の実行を開始しました',
    'notification.task.review.title': 'レビュー待ち',
    'notification.task.review.message': '{0} がレビュー待ちです',
    'notification.task.completed.title': 'タスク完了',
    'notification.task.completed.message': '{0} が完了しました',
    'notification.task.error.title': 'タスクエラー',
    'notification.task.error.message': '{0} でエラーが発生しました: {1}',
    'notification.feedback.completed.title': 'フィードバック対応完了',
    'notification.feedback.completed.message': '{0} のフィードバックが対応されました',
    'notification.claude.slow.title': 'Claude Code応答遅延',
    'notification.claude.slow.message': '{0} の処理に時間がかかっています。しばらくお待ちください。',
    'notification.task.auto.reset.title': 'タスク自動リセット',
    'notification.task.auto.reset.message': 'タスク「{0}」が{1}分以上停止したため、自動的に未対応に戻しました。',
    
    // Themes
    'theme.light': 'ライト',
    'theme.dark': 'ダーク',
    'theme.system': 'システム',
    
    // Languages
    'language.japanese': '日本語',
    'language.english': 'English',
    
    // Archive
    'archive.title': 'アーカイブ',
    'archive.empty': 'アーカイブされたタスクはありません',
    'archive.delete.permanent': '完全削除',
    'archive.confirm.delete': 'このタスクを完全に削除しますか？この操作は取り消せません。',
    'archive.confirm.message': 'アーカイブ後も閲覧は可能ですが、編集はできなくなります。',
    'archive.description': 'アーカイブされたタスクの一覧です。必要に応じて完全に削除することができます。',
    'archive.date': 'アーカイブ日時',
    
    // Execution logs
    'execution.empty': '実行履歴がありません',
    'execution.running': '実行中',
    'execution.paused': '一時停止',
    'execution.completed': '完了',
    'execution.failed': '失敗',
    'execution.in.progress': '進行中',
    'execution.retry': 'リトライ',
    'execution.times': '回',
    'execution.started': '開始',
    'execution.duration': '実行時間',
    'execution.error': 'エラー',
    'execution.logs': '実行ログ',
    'execution.output.path': '出力先',
    
    // Output files
    'output.empty': 'まだ成果物がありません。タスクを実行すると、ここに成果物が表示されます。',
    'output.download': 'ダウンロード',
    'output.download.all': '一括ダウンロード',
    'output.view': '表示',
    'output.file.list': 'ファイル一覧',
    'output.select.file': 'ファイルを選択してプレビューを表示',
    'output.error.load': 'ファイルの読み込みに失敗しました',
    
    // Messages
    'message.saved': '保存しました',
    'message.created': '作成しました',
    'message.updated': '更新しました',
    'message.deleted': '削除しました',
    'message.archived': 'アーカイブしました',
    'message.approved': '承認しました',
    'message.rejected': '差し戻しました',
    'message.paused': '一時停止しました',
    'message.executed': '実行キューに追加しました',
    'message.error': 'エラーが発生しました',
    'message.error.load': '読み込みに失敗しました',
    'message.error.save': '保存に失敗しました',
    'message.error.delete': '削除に失敗しました',
    
    // Task execution notifications
    'message.task.started': 'が「{title}」の作業を開始しました',
    'message.task.completed': 'が「{title}」の作業を完了しました',
    'message.task.review': 'が「{title}」をレビュー待ちにしました',
    
    // Time
    'time.ago': '前',
    'time.now': 'たった今',
    'time.minutes': '分',
    'time.hours': '時間',
    'time.days': '日',
    'time.seconds': '秒',
    
    // Stats
    'stats.total': '総タスク数',
    'stats.pending': '未対応',
    'stats.working': '作業中',
    'stats.completed': '完了',
    
    // Loading
    'loading': '読み込み中...',
    
    // General
    'actions': '操作',
    'required': 'を入力してください',
    'scroll': 'スクロール',
    
    // Navigation
    'navigation.back': '戻る',
    
    // Attachments
    'attachments.title': '添付ファイル',
    'attachments.empty': '添付ファイルはありません',
    'attachment.upload': 'アップロード',
    'attachment.uploading': 'アップロード中...',
    'attachment.uploaded': 'アップロードしました',
    'attachment.upload.failed': 'アップロードに失敗しました',
    'attachment.download': 'ダウンロード',
    'attachment.view': '表示',
    'attachment.delete': '削除',
    'attachment.delete.confirm': 'この添付ファイルを削除しますか？',
    'attachment.deleted': '削除しました',
    'attachment.delete.failed': '削除に失敗しました',
    'attachment.select': 'ファイルを選択',
    'attachment.new': '新しい添付ファイル',
    
    // Stuck tasks
    'stuck.tasks.title': '停止中のタスク',
    'stuck.task.detected': 'タスクが停止しています',
    'stuck.task.restart': '再開',
    'stuck.task.restarted': 'タスクを再開しました',
    'stuck.task.restart.failed': 'タスクの再開に失敗しました',
    'stuck.task.minutes': '分間停止',
    
    // Notifications
    'notifications.title': '通知',
    'notifications.empty': '通知はありません',
    'notifications.mark.all.read': 'すべて既読にする',
    
    // Notification labels
    'notification.new': '新着',
    'notification.updated': '更新',
    
    // Sound types
    'sound.default': 'デフォルト',
    'sound.chime': 'チャイム',
    'sound.bell': 'ベル',
    
    // Backend Status
    'backend.status.label': 'バックエンドサーバー',
    'backend.status.online': 'オンライン',
    'backend.status.offline': 'オフライン',
    'backend.status.checking': 'チェック中',
    'backend.status.start_command': '起動コマンド',
    
    // Task Timeout Settings
    'settings.task.timeout': 'タスクタイムアウト',
    'settings.task.timeout.desc': '指定時間後に停止したタスクを自動的に未対応に戻す',
    'settings.task.timeout.enable': 'タスクタイムアウトを有効にする',
    'settings.task.timeout.minutes': 'タイムアウト時間（分）',
    'settings.task.timeout.disabled': '無効',
    'settings.task.timeout.10min': '10分',
    'settings.task.timeout.20min': '20分',
    'settings.task.timeout.30min': '30分',
    'settings.task.timeout.45min': '45分',
    'settings.task.timeout.60min': '60分',
    
    // Force Cleanup
    'settings.force.cleanup': '強制クリーンアップ',
    'settings.force.cleanup.desc': 'すべての停止中タスクを未対応ステータスにリセット',
    'settings.force.cleanup.button': '停止中タスクをリセット',
    'settings.force.cleanup.confirm': 'すべての停止中タスクを未対応ステータスにリセットしてもよろしいですか？',
    'settings.force.cleanup.success': 'すべての停止中タスクを未対応ステータスにリセットしました',
    'settings.force.cleanup.failed': '停止中タスクのリセットに失敗しました',
    
    // Permissions
    'settings.permissions': '権限設定',
    
    // Custom Prompt
    'settings.custom.prompt': 'カスタムプロンプト',
  },
  en: {
    // Dashboard
    'dashboard.title': 'Claude Code Kanban Automator',
    
    // Task general
    'task.new': 'New Task',
    'task.pending': 'Pending',
    'task.requested': 'Requested',
    'task.working': 'Working',
    'task.review': 'Review',
    'task.completed': 'Completed',
    'task.title': 'Title',
    'task.description': 'Description',
    'task.priority': 'Priority',
    'task.priority.high': 'High',
    'task.priority.medium': 'Medium',
    'task.priority.low': 'Low',
    'task.status': 'Status',
    'task.created': 'Created',
    'task.updated': 'Updated',
    'task.archive': 'Archive',
    'task.due': 'Due',
    'task.rework': 'Rework',
    'task.execute': 'Request work to Claude Code',
    'task.approve': 'Approve and Complete',
    'task.reject': 'Reject and Rework',
    'task.pause': 'Pause',
    'task.id': 'ID',
    'task.version': 'Version',
    'task.info': 'Task Information',
    'task.create.title': 'Create New Task',
    'task.edit.title': 'Edit Task',
    'task.detail.title': 'Task Details',
    'task.not.found': 'Task not found',
    'task.back.dashboard': 'Back to Dashboard',
    'task.title.placeholder': 'Enter task title',
    'task.description.placeholder': 'Enter detailed task description',
    
    // Task tabs
    'tab.basic.info': 'Basic Info',
    'tab.execution.logs': 'Execution Logs',
    'tab.outputs': 'Outputs',
    'tab.feedback': 'Feedback',
    'tab.attachments': 'Attachments',
    
    // Buttons
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.delete': 'Delete',
    'button.close': 'Close',
    'button.edit': 'Edit',
    'button.create': 'Create',
    'button.update': 'Update',
    
    // Feedback
    'feedback.title': 'Feedback',
    'feedback.add': 'Add Feedback',
    'feedback.send': 'Send Feedback',
    'feedback.sending': 'Sending...',
    'feedback.placeholder': 'Please describe corrections or improvement requests...',
    'feedback.history': 'Feedback History',
    'feedback.empty': 'No feedback yet',
    'feedback.addressed': 'Addressed',
    'feedback.reject.reason': 'Please enter the reason for rejection',
    
    // Settings
    'settings.title': 'Settings',
    'settings.notifications': 'Notifications',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.desktop.notifications': 'Desktop Notifications',
    'settings.desktop.notifications.desc': 'Show browser desktop notifications',
    'settings.sound.notifications': 'Sound Notifications',
    'settings.sound.notifications.desc': 'Play notification sounds',
    'settings.sound.volume': 'Notification Volume',
    'settings.sound.type': 'Notification Sound',
    'settings.theme': 'Theme',
    'settings.theme.desc': 'Auto mode follows your system preference for light/dark theme.',
    
    // Notification types
    'notification.desktop': 'Desktop Notifications',
    'notification.sound': 'Sound Notifications',
    'notification.volume': 'Notification Volume',
    'notification.type': 'Notification Sound',
    'notification.items': 'Notification Items',
    'notification.review.request': 'Review Request',
    'notification.review.request.desc': 'When a task is waiting for review',
    'notification.task.complete': 'Task Complete',
    'notification.task.complete.desc': 'When a task is completed',
    'notification.error': 'Error Occurred',
    'notification.error.desc': 'When an error occurs during task execution',
    'notification.task.start': 'Task Start',
    'notification.task.start.desc': 'When task execution begins',
    'notification.feedback.complete': 'Feedback Response',
    'notification.feedback.complete.desc': 'When feedback response is completed',
    
    // Notification messages
    'notification.task.started.title': 'Task Started',
    'notification.task.started.message': 'Started executing {0}',
    'notification.task.review.title': 'Review Required',
    'notification.task.review.message': '{0} is waiting for review',
    'notification.task.completed.title': 'Task Completed',
    'notification.task.completed.message': '{0} has been completed',
    'notification.task.error.title': 'Task Error',
    'notification.task.error.message': 'Error occurred in {0}: {1}',
    'notification.feedback.completed.title': 'Feedback Addressed',
    'notification.feedback.completed.message': 'Feedback for {0} has been addressed',
    'notification.claude.slow.title': 'Claude Code Slow Response',
    'notification.claude.slow.message': '{0} is taking longer than expected. Please wait...',
    'notification.task.auto.reset.title': 'Task Auto Reset',
    'notification.task.auto.reset.message': 'Task "{0}" was stuck for more than {1} minutes and has been automatically reset to pending.',
    
    // Themes
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Languages
    'language.japanese': '日本語',
    'language.english': 'English',
    
    // Archive
    'archive.title': 'Archive',
    'archive.empty': 'No archived tasks',
    'archive.delete.permanent': 'Delete Permanently',
    'archive.confirm.delete': 'Are you sure you want to permanently delete this task? This action cannot be undone.',
    'archive.confirm.message': 'After archiving, the task will still be viewable but cannot be edited.',
    'archive.description': 'List of archived tasks. You can permanently delete them if needed.',
    'archive.date': 'Archived Date',
    
    // Execution logs
    'execution.empty': 'No execution history',
    'execution.running': 'Running',
    'execution.paused': 'Paused',
    'execution.completed': 'Completed',
    'execution.failed': 'Failed',
    'execution.in.progress': 'In Progress',
    'execution.retry': 'Retry',
    'execution.times': 'times',
    'execution.started': 'Started',
    'execution.duration': 'Duration',
    'execution.error': 'Error',
    'execution.logs': 'Execution Logs',
    'execution.output.path': 'Output Path',
    
    // Output files
    'output.empty': 'No output files yet. Files will appear here after task execution.',
    'output.download': 'Download',
    'output.download.all': 'Download All',
    'output.view': 'View',
    'output.file.list': 'File List',
    'output.select.file': 'Select a file to display preview',
    'output.error.load': 'Failed to load file',
    
    // Messages
    'message.saved': 'Saved successfully',
    'message.created': 'Created successfully',
    'message.updated': 'Updated successfully',
    'message.deleted': 'Deleted successfully',
    'message.archived': 'Archived successfully',
    'message.approved': 'Approved successfully',
    'message.rejected': 'Rejected successfully',
    'message.paused': 'Paused successfully',
    'message.executed': 'Added to execution queue',
    'message.error': 'An error occurred',
    'message.error.load': 'Failed to load',
    'message.error.save': 'Failed to save',
    'message.error.delete': 'Failed to delete',
    
    // Time
    'time.ago': 'ago',
    'time.now': 'just now',
    'time.minutes': 'minutes',
    'time.hours': 'hours',
    'time.days': 'days',
    'time.seconds': 'seconds',
    
    // Stats
    'stats.total': 'Total Tasks',
    'stats.pending': 'Pending',
    'stats.working': 'Working',
    'stats.completed': 'Completed',
    
    // Loading
    'loading': 'Loading...',
    
    // General
    'actions': 'Actions',
    'required': ' is required',
    'scroll': 'scroll',
    
    // Navigation
    'navigation.back': 'Back',
    
    // Attachments
    'attachments.title': 'Attachments',
    'attachments.empty': 'No attachments',
    'attachment.upload': 'Upload',
    'attachment.uploading': 'Uploading...',
    'attachment.uploaded': 'File uploaded successfully',
    'attachment.upload.failed': 'Failed to upload file',
    'attachment.download': 'Download',
    'attachment.view': 'View',
    'attachment.delete': 'Delete',
    'attachment.delete.confirm': 'Delete this attachment?',
    'attachment.deleted': 'Deleted successfully',
    'attachment.delete.failed': 'Failed to delete',
    'attachment.select': 'Select files',
    'attachment.new': 'New attachments',
    
    // Stuck tasks
    'stuck.tasks.title': 'Stuck Tasks',
    'stuck.task.detected': 'Task is stuck',
    'stuck.task.restart': 'Restart',
    'stuck.task.restarted': 'Task restarted successfully',
    'stuck.task.restart.failed': 'Failed to restart task',
    'stuck.task.minutes': 'minutes stuck',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.empty': 'No notifications',
    'notifications.mark.all.read': 'Mark all as read',
    
    // Notification labels
    'notification.new': 'NEW',
    'notification.updated': 'UPDATED',
    
    // Sound types
    'sound.default': 'Default',
    'sound.chime': 'Chime',
    'sound.bell': 'Bell',
    
    // Backend Status
    'backend.status.label': 'Backend Server',
    'backend.status.online': 'Online',
    'backend.status.offline': 'Offline',
    'backend.status.checking': 'Checking',
    'backend.status.start_command': 'Start Command',
    
    // Task Timeout Settings
    'settings.task.timeout': 'Task Timeout',
    'settings.task.timeout.desc': 'Automatically reset stuck tasks after specified time',
    'settings.task.timeout.enable': 'Enable task timeout',
    'settings.task.timeout.minutes': 'Timeout minutes',
    'settings.task.timeout.disabled': 'Disabled',
    'settings.task.timeout.10min': '10 minutes',
    'settings.task.timeout.20min': '20 minutes',
    'settings.task.timeout.30min': '30 minutes',
    'settings.task.timeout.45min': '45 minutes',
    'settings.task.timeout.60min': '60 minutes',
    
    // Force Cleanup
    'settings.force.cleanup': 'Force Cleanup',
    'settings.force.cleanup.desc': 'Reset all stuck tasks to pending status',
    'settings.force.cleanup.button': 'Reset Stuck Tasks',
    'settings.force.cleanup.confirm': 'Are you sure you want to reset all stuck tasks to pending status?',
    'settings.force.cleanup.success': 'All stuck tasks have been reset to pending status',
    'settings.force.cleanup.failed': 'Failed to reset stuck tasks',
    
    // Permissions
    'settings.permissions': 'Permissions',
    
    // Custom Prompt
    'settings.custom.prompt': 'Custom Prompt',
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language')
    return (saved as Language) || 'ja'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string): string => {
    const translation = translations[language] as Record<string, string>
    return translation[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}