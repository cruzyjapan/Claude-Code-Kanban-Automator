import React, { useEffect, useState } from 'react'
import { Switch } from '@headlessui/react'
import { ShieldCheckIcon, ShieldExclamationIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { settingsApi } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { UserSettings } from '../types'
import toast from 'react-hot-toast'

export default function PermissionSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [permissionConfig, setPermissionConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { t, language } = useLanguage()

  useEffect(() => {
    loadSettings()
    loadPermissionConfig()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get()
      setSettings(data)
      if (data.permission_config) {
        setPermissionConfig(JSON.parse(data.permission_config))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error(t('message.error.load'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadPermissionConfig = async () => {
    try {
      const response = await fetch('/api/permissions/config')
      const data = await response.json()
      if (!permissionConfig) {
        setPermissionConfig(data)
      }
    } catch (error) {
      console.error('Failed to load permission config:', error)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (!settings) return

    setIsSaving(true)
    try {
      await settingsApi.update({
        enable_dangerous_permissions: enabled ? 1 : 0
      })
      setSettings({ ...settings, enable_dangerous_permissions: enabled ? 1 : 0 })
      toast.success(t('message.saved'))
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error(t('message.error.save'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePermissionChange = async (category: string, operation: string, value: boolean) => {
    if (!permissionConfig) return

    const newConfig = {
      ...permissionConfig,
      allowed_operations: {
        ...permissionConfig.allowed_operations,
        [category]: {
          ...permissionConfig.allowed_operations[category],
          [operation]: value
        }
      }
    }

    setPermissionConfig(newConfig)
    setIsSaving(true)

    try {
      await settingsApi.update({
        permission_config: JSON.stringify(newConfig)
      })
      toast.success(t('message.saved'))
    } catch (error) {
      console.error('Failed to update permission config:', error)
      toast.error(t('message.error.save'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !settings || !permissionConfig) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'ja' ? 'Claude Code 権限設定' : 'Claude Code Permissions'}
        </h3>

        {/* Main Toggle */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            {settings.enable_dangerous_permissions ? (
              <ShieldExclamationIcon className="w-6 h-6 text-orange-600" />
            ) : (
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            )}
            <div>
              <p className="font-medium">
                {language === 'ja' ? '危険な権限を有効にする' : 'Enable Dangerous Permissions'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                --dangerously-skip-permissions
              </p>
            </div>
          </div>
          <Switch
            checked={settings.enable_dangerous_permissions === 1}
            onChange={handleToggle}
            disabled={isSaving}
            className={`${
              settings.enable_dangerous_permissions ? 'bg-orange-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                settings.enable_dangerous_permissions ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {/* Warning Message */}
        {settings.enable_dangerous_permissions === 1 && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex gap-3">
              <InformationCircleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {permissionConfig.warning_message[language] || permissionConfig.warning_message.en}
              </p>
            </div>
          </div>
        )}

        {/* Detailed Permissions */}
        {settings.enable_dangerous_permissions === 1 && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              {language === 'ja' ? '詳細な権限設定' : 'Detailed Permission Settings'}
            </h4>
            
            {Object.entries(permissionConfig.allowed_operations).map(([category, operations]: [string, any]) => (
              <div key={category} className="border dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium mb-3 text-sm">
                  {operations.description}
                </h5>
                <div className="space-y-2">
                  {Object.entries(operations).map(([op, value]) => {
                    if (op === 'description') return null
                    return (
                      <div key={op} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {op.replace(/_/g, ' ').charAt(0).toUpperCase() + op.slice(1).replace(/_/g, ' ')}
                        </span>
                        <Switch
                          checked={value as boolean}
                          onChange={(val) => handlePermissionChange(category, op, val)}
                          disabled={isSaving}
                          className={`${
                            value ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              value ? 'translate-x-5' : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Custom Rules Section */}
            <div className="mt-6 border dark:border-gray-700 rounded-lg p-4">
              <h5 className="font-medium mb-3 text-sm">
                {language === 'ja' ? 'カスタムルール' : 'Custom Rules'}
              </h5>
              <div className="space-y-2">
                {permissionConfig.custom_rules.map((rule: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div>
                      <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        {rule.pattern}
                      </code>
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                        {rule.description}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${rule.allowed ? 'text-green-600' : 'text-red-600'}`}>
                      {rule.allowed ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}