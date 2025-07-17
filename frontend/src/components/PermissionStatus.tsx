import React, { useEffect, useState } from 'react'
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'
import { settingsApi } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { UserSettings } from '../types'

export default function PermissionStatus() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [permissionDetails, setPermissionDetails] = useState<any>(null)
  const { language } = useLanguage()

  useEffect(() => {
    loadSettings()
    loadPermissionDetails()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get()
      setSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadPermissionDetails = async () => {
    try {
      const response = await fetch('/api/permissions/config')
      const data = await response.json()
      setPermissionDetails(data)
    } catch (error) {
      console.error('Failed to load permission details:', error)
    }
  }

  const getStatusText = () => {
    if (!settings) return ''
    
    if (settings.enable_dangerous_permissions) {
      return language === 'ja' 
        ? '--dangerously-skip-permissions 有効'
        : '--dangerously-skip-permissions Enabled'
    } else {
      return language === 'ja'
        ? '通常権限モード'
        : 'Normal Permission Mode'
    }
  }

  const getStatusColor = () => {
    if (!settings) return 'text-gray-500'
    return settings.enable_dangerous_permissions ? 'text-orange-600' : 'text-green-600'
  }

  const getIcon = () => {
    if (!settings) return null
    return settings.enable_dangerous_permissions ? (
      <ShieldExclamationIcon className="w-5 h-5" />
    ) : (
      <ShieldCheckIcon className="w-5 h-5" />
    )
  }

  const getTooltipContent = () => {
    if (!settings || !permissionDetails) return ''
    
    if (settings.enable_dangerous_permissions) {
      const allowed = []
      const restricted = []
      
      Object.entries(permissionDetails.allowed_operations).forEach(([category, ops]: [string, any]) => {
        Object.entries(ops).forEach(([op, value]) => {
          if (op !== 'description') {
            if (value) {
              allowed.push(`${category}.${op}`)
            } else {
              restricted.push(`${category}.${op}`)
            }
          }
        })
      })
      
      return language === 'ja' ? `
許可された操作:
• ファイルの読み取り・作成・編集
• ディレクトリの作成
• コード実行とテスト
• Git操作（プッシュ以外）

制限された操作:
• ファイル・ディレクトリの削除
• パッケージのインストール
• システム設定の変更
• 権限の変更
      `.trim() : `
Allowed Operations:
• Read, create, and edit files
• Create directories
• Execute code and run tests
• Git operations (except push)

Restricted Operations:
• Delete files or directories
• Install packages
• Modify system configuration
• Change permissions
      `.trim()
    } else {
      return language === 'ja'
        ? 'Claude Codeは標準の権限で動作します。ファイル操作に制限があります。'
        : 'Claude Code operates with standard permissions. File operations are restricted.'
    }
  }

  if (!settings) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      {!!settings.enable_dangerous_permissions && permissionDetails && (
        <div className="relative group">
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded-lg p-3 mt-2 w-64 whitespace-pre-line">
            {getTooltipContent()}
            <div className="absolute top-0 left-4 -mt-1 w-2 h-2 bg-gray-800 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  )
}