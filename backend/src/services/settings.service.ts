import { getDatabase } from './database.service'
import { UserSettings } from '../types'

export class SettingsService {
  async getSettings(userId: string = 'default'): Promise<UserSettings> {
    const db = getDatabase()
    const settings = await db.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    )
    
    // Return default settings if none exist
    if (!settings) {
      return {
        user_id: userId,
        desktop_notifications: 1,
        sound_enabled: 1,
        sound_volume: 50,
        sound_type: 'default',
        notify_review_request: 1,
        notify_task_complete: 1,
        notify_error: 1,
        notify_task_start: 0,
        notify_feedback_complete: 1,
        theme: 'auto',
        language: 'ja',
        task_timeout_minutes: 10,
        enable_task_timeout: 1,
        enable_dangerous_permissions: 0,
        permission_config: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    return settings
  }

  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const db = getDatabase()
    
    // Check if settings exist
    const existingSettings = await this.getSettings(userId)
    
    if (existingSettings.user_id === userId && existingSettings.created_at) {
      // Update existing settings
      const updateFields = Object.keys(updates)
        .filter(key => key !== 'user_id')
        .map(key => `${key} = ?`)
        .join(', ')
      
      const values = Object.keys(updates)
        .filter(key => key !== 'user_id')
        .map(key => updates[key as keyof UserSettings])
      
      await db.run(
        `UPDATE user_settings SET ${updateFields}, updated_at = datetime('now') WHERE user_id = ?`,
        [...values, userId]
      )
    } else {
      // Insert new settings
      const fields = ['user_id', ...Object.keys(updates).filter(key => key !== 'user_id')]
      const placeholders = fields.map(() => '?').join(', ')
      const values = [userId, ...Object.keys(updates).filter(key => key !== 'user_id').map(key => updates[key as keyof UserSettings])]
      
      await db.run(
        `INSERT INTO user_settings (${fields.join(', ')}, created_at, updated_at) 
         VALUES (${placeholders}, datetime('now'), datetime('now'))`,
        values
      )
    }
    
    // Return updated settings
    return await this.getSettings(userId)
  }
}