import React, { useState, useEffect } from 'react'
import { Tab } from '@headlessui/react'
import { BellIcon, SpeakerWaveIcon, PaintBrushIcon, LanguageIcon, TrashIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import clsx from 'clsx'
import { settingsApi, taskApi } from '../services/api'
import toast from 'react-hot-toast'
import PermissionSettings from '../components/PermissionSettings'

export default function Settings() {
  const { soundEnabled, setSoundEnabled, soundType, setSoundType, soundVolume, setSoundVolume } = useNotifications()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)
  
  // Save settings to API
  const saveSettingsToAPI = async (settings: any) => {
    try {
      await settingsApi.update(settings)
    } catch (error) {
      console.error('Failed to save settings to API:', error)
    }
  }

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    desktop_notifications: true,
    notify_review_request: true,
    notify_task_complete: true,
    notify_error: true,
    notify_task_start: false,
    notify_feedback_complete: true,
    task_timeout_minutes: 10,
    enable_task_timeout: true,
  })
  
  // Custom prompt settings
  const [customPromptInstructions, setCustomPromptInstructions] = useState('')
  const [savedCustomPromptInstructions, setSavedCustomPromptInstructions] = useState('')
  const [isSavingCustomPrompt, setIsSavingCustomPrompt] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setNotificationSettings({
          desktop_notifications: settings.desktop_notifications ?? true,
          notify_review_request: settings.notify_review_request ?? true,
          notify_task_complete: settings.notify_task_complete ?? true,
          notify_error: settings.notify_error ?? true,
          notify_task_start: settings.notify_task_start ?? false,
          notify_feedback_complete: settings.notify_feedback_complete ?? true,
          task_timeout_minutes: settings.task_timeout_minutes ?? 10,
          enable_task_timeout: settings.enable_task_timeout ?? true,
        })
        setCustomPromptInstructions(settings.custom_prompt_instructions || '')
        setSavedCustomPromptInstructions(settings.custom_prompt_instructions || '')
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleNotificationSettingChange = async (key: string, value: any) => {
    const updatedSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(updatedSettings)
    
    try {
      // Save to backend
      await settingsApi.update(updatedSettings)
      toast.success('設定を保存しました')
    } catch (error) {
      toast.error('設定の保存に失敗しました')
      console.error('Failed to save settings:', error)
      // Revert on error
      setNotificationSettings(notificationSettings)
    }
  }

  const soundTypes = [
    { value: 'default', label: 'デフォルト' },
    { value: 'chime', label: 'チャイム' },
    { value: 'bell', label: 'ベル' },
  ]

  const handleForceCleanup = async () => {
    if (confirm(t('settings.force.cleanup.confirm'))) {
      try {
        await taskApi.forceCleanup()
        toast.success(t('settings.force.cleanup.success'))
      } catch (error) {
        toast.error(t('settings.force.cleanup.failed'))
        console.error('Force cleanup failed:', error)
      }
    }
  }

  const playTestSound = () => {
    if (soundEnabled) {
      try {
        // Use Web Audio API to generate test sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        const generateTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
          oscillator.type = type
          
          const volume = soundVolume / 100 * 0.3
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + duration)
        }
        
        // Play test tone based on selected sound type
        switch (soundType) {
          case 'chime':
            // High pitched ascending chimes (clearly different)
            generateTone(659, 0.12, 'sine')    // E note
            setTimeout(() => generateTone(880, 0.12, 'sine'), 120)   // A note
            setTimeout(() => generateTone(1047, 0.18, 'sine'), 240)  // C note
            setTimeout(() => generateTone(1319, 0.15, 'sine'), 360)  // E note (higher)
            break
          case 'bell':
            // Deep bell-like sound with distinct harmonics
            generateTone(220, 0.5, 'triangle')  // Low fundamental
            setTimeout(() => generateTone(440, 0.3, 'sine'), 30)    // Octave harmonic
            setTimeout(() => generateTone(660, 0.2, 'sine'), 60)    // Fifth harmonic
            setTimeout(() => generateTone(880, 0.15, 'sine'), 90)   // Octave harmonic
            break
          default: // default
            // Simple two-tone notification (more distinct)
            generateTone(800, 0.18, 'square')
            setTimeout(() => generateTone(600, 0.22, 'square'), 180)
            break
        }
      } catch (error) {
        console.error('Failed to play test sound:', error)
        toast.error('音声の再生に失敗しました')
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-full overflow-hidden">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab} className="flex flex-col h-[calc(100vh-180px)]">
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <BellIcon className="w-5 h-5" />
              {t('settings.notifications')}
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <PaintBrushIcon className="w-5 h-5" />
              {t('settings.appearance')}
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <LanguageIcon className="w-5 h-5" />
              {t('settings.language')}
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              {t('settings.permissions') || 'Permissions'}
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              {t('settings.custom.prompt') || 'カスタムプロンプト'}
            </div>
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-6 flex-1 overflow-hidden">
          {/* Notification Settings */}
          <Tab.Panel className="h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.notifications')}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.desktop.notifications')}</p>
                      <p className="text-sm text-gray-500">{t('settings.desktop.notifications.desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.desktop_notifications}
                        onChange={(e) => handleNotificationSettingChange('desktop_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.sound.notifications')}</p>
                      <p className="text-sm text-gray-500">{t('settings.sound.notifications.desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={async (e) => {
                          const enabled = e.target.checked
                          setSoundEnabled(enabled)
                          await saveSettingsToAPI({ sound_enabled: enabled })
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {soundEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.sound.volume')}
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={soundVolume}
                            onChange={async (e) => {
                              const newVolume = parseInt(e.target.value)
                              setSoundVolume(newVolume)
                              await saveSettingsToAPI({ sound_volume: newVolume })
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm w-12 text-right">{soundVolume}%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.sound.type')}
                        </label>
                        <div className="flex items-center gap-3">
                          <select
                            value={soundType}
                            onChange={async (e) => {
                              const newType = e.target.value
                              setSoundType(newType)
                              await saveSettingsToAPI({ sound_type: newType })
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                          >
                            <option value="default">{t('sound.default')}</option>
                            <option value="chime">{t('sound.chime')}</option>
                            <option value="bell">{t('sound.bell')}</option>
                          </select>
                          <button
                            onClick={playTestSound}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <SpeakerWaveIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('notification.items')}</h3>
                
                <div className="space-y-3">
                  {[
                    { key: 'notify_review_request', label: t('notification.review.request'), description: t('notification.review.request.desc') },
                    { key: 'notify_task_complete', label: t('notification.task.complete'), description: t('notification.task.complete.desc') },
                    { key: 'notify_error', label: t('notification.error'), description: t('notification.error.desc') },
                    { key: 'notify_task_start', label: t('notification.task.start'), description: t('notification.task.start.desc') },
                    { key: 'notify_feedback_complete', label: t('notification.feedback.complete'), description: t('notification.feedback.complete.desc') },
                  ].map(item => (
                    <label key={item.key} className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                        onChange={(e) => handleNotificationSettingChange(item.key, e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="ml-3">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.task.timeout')}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.task.timeout.enable')}</p>
                      <p className="text-sm text-gray-500">{t('settings.task.timeout.desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.enable_task_timeout}
                        onChange={(e) => handleNotificationSettingChange('enable_task_timeout', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {notificationSettings.enable_task_timeout && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.task.timeout.minutes')}
                      </label>
                      <select
                        value={notificationSettings.task_timeout_minutes}
                        onChange={(e) => handleNotificationSettingChange('task_timeout_minutes', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="10">{t('settings.task.timeout.10min')}</option>
                        <option value="20">{t('settings.task.timeout.20min')}</option>
                        <option value="30">{t('settings.task.timeout.30min')}</option>
                        <option value="45">{t('settings.task.timeout.45min')}</option>
                        <option value="60">{t('settings.task.timeout.60min')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.force.cleanup')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-4">{t('settings.force.cleanup.desc')}</p>
                    <button
                      onClick={handleForceCleanup}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                      {t('settings.force.cleanup.button')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Appearance Settings */}
          <Tab.Panel className="h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('settings.appearance')}</h3>
              
              <div>
                <label className="block text-sm font-medium mb-3">{t('settings.theme')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: t('theme.light'), icon: '☀️' },
                    { value: 'dark', label: t('theme.dark'), icon: '🌙' },
                    { value: 'auto', label: t('theme.system'), icon: '🌓' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={async () => {
                        setTheme(option.value as any)
                        await saveSettingsToAPI({ theme: option.value })
                      }}
                      className={clsx(
                        'p-4 rounded-lg border-2 transition-colors',
                        theme === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <p className="font-medium">{option.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {t('settings.theme.desc')}
                </p>
              </div>
            </div>
          </Tab.Panel>

          {/* Language Settings */}
          <Tab.Panel className="h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('settings.language')}</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    setLanguage('ja')
                    await saveSettingsToAPI({ language: 'ja' })
                  }}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-colors text-left',
                    language === 'ja'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="text-2xl mb-2">🇯🇵</div>
                  <p className="font-medium">{t('language.japanese')}</p>
                </button>
                <button
                  onClick={async () => {
                    setLanguage('en')
                    await saveSettingsToAPI({ language: 'en' })
                  }}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-colors text-left',
                    language === 'en'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="text-2xl mb-2">🇺🇸</div>
                  <p className="font-medium">{t('language.english')}</p>
                </button>
              </div>
            </div>
          </Tab.Panel>

          {/* Permission Settings */}
          <Tab.Panel className="h-full overflow-y-auto">
            <PermissionSettings />
          </Tab.Panel>

          {/* Custom Prompt Settings */}
          <Tab.Panel className="h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'ja' ? 'カスタムプロンプト設定' : 'Custom Prompt Settings'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {language === 'ja' 
                    ? 'ここで設定した指示は、すべてのタスク実行時にprompt.mdファイルに追加されます。Claude Codeに対する共通の指示や制約を設定できます。'
                    : 'Instructions set here will be added to the prompt.md file for all task executions. You can set common instructions or constraints for Claude Code.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ja' ? '追加の固定プロンプト指示' : 'Additional Fixed Prompt Instructions'}
                </label>
                <textarea
                  value={customPromptInstructions}
                  onChange={(e) => setCustomPromptInstructions(e.target.value)}
                  placeholder={language === 'ja' 
                    ? '例: \n- 日本語でコメントを書いてください\n- TypeScriptを使用してください\n- テストコードも作成してください'
                    : 'Example: \n- Write comments in Japanese\n- Use TypeScript\n- Create test code as well'}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 resize-none"
                />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={async () => {
                      setIsSavingCustomPrompt(true)
                      try {
                        await settingsApi.update({ custom_prompt_instructions: customPromptInstructions })
                        setSavedCustomPromptInstructions(customPromptInstructions)
                        toast.success(language === 'ja' ? 'カスタムプロンプトを適用しました' : 'Custom prompt applied')
                      } catch (error) {
                        toast.error(language === 'ja' ? 'カスタムプロンプトの適用に失敗しました' : 'Failed to apply custom prompt')
                        console.error('Failed to apply custom prompt:', error)
                      } finally {
                        setIsSavingCustomPrompt(false)
                      }
                    }}
                    disabled={isSavingCustomPrompt || customPromptInstructions === savedCustomPromptInstructions}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isSavingCustomPrompt || customPromptInstructions === savedCustomPromptInstructions
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500'
                    }`}
                  >
                    {isSavingCustomPrompt 
                      ? (language === 'ja' ? '保存中...' : 'Saving...') 
                      : (language === 'ja' ? '適用' : 'Apply')}
                  </button>
                  <button
                    onClick={() => {
                      setCustomPromptInstructions('')
                    }}
                    disabled={isSavingCustomPrompt}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {language === 'ja' ? 'クリア' : 'Clear'}
                  </button>
                  {customPromptInstructions !== savedCustomPromptInstructions && (
                    <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      {language === 'ja' ? '※ 未保存の変更があります' : '※ You have unsaved changes'}
                    </span>
                  )}
                </div>
                {savedCustomPromptInstructions && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {language === 'ja' ? '✓ 現在適用中のカスタムプロンプト:' : '✓ Currently applied custom prompt:'}
                    </p>
                    <pre className="mt-1 text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap">
                      {savedCustomPromptInstructions.length > 100 
                        ? savedCustomPromptInstructions.substring(0, 100) + '...' 
                        : savedCustomPromptInstructions}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}