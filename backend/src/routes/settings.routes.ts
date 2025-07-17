import { Router, Request, Response } from 'express'
import { getDatabase } from '../services/database.service'
import * as fs from 'fs/promises'
import * as path from 'path'

const router = Router()

// Get user settings
router.get('/settings/:userId?', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || 'default'
    const db = await getDatabase()
    
    const settings = await db.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    )
    
    // Return default settings if none exist
    if (!settings) {
      const defaultSettings = {
        user_id: userId,
        desktop_notifications: true,
        sound_enabled: true,
        sound_volume: 50,
        sound_type: 'default',
        notify_review_request: true,
        notify_task_complete: true,
        notify_error: true,
        notify_task_start: false,
        notify_feedback_complete: true,
        theme: 'auto',
        language: 'ja'
      }
      
      return res.json(defaultSettings)
    }
    
    return res.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update user settings
router.put('/settings/:userId?', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || 'default'
    const settings = req.body
    const db = await getDatabase()
    
    // Check if settings exist
    const existingSettings = await db.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    )
    
    if (existingSettings) {
      // Update existing settings
      const updateFields = Object.keys(settings)
        .filter(key => key !== 'user_id')
        .map(key => `${key} = ?`)
        .join(', ')
      
      const values = Object.keys(settings)
        .filter(key => key !== 'user_id')
        .map(key => settings[key])
      
      await db.run(
        `UPDATE user_settings SET ${updateFields}, updated_at = datetime('now') WHERE user_id = ?`,
        [...values, userId]
      )
    } else {
      // Insert new settings
      const fields = ['user_id', ...Object.keys(settings).filter(key => key !== 'user_id')]
      const placeholders = fields.map(() => '?').join(', ')
      const values = [userId, ...Object.keys(settings).filter(key => key !== 'user_id').map(key => settings[key])]
      
      await db.run(
        `INSERT INTO user_settings (${fields.join(', ')}, created_at, updated_at) 
         VALUES (${placeholders}, datetime('now'), datetime('now'))`,
        values
      )
    }
    
    // Return updated settings
    const updatedSettings = await db.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    )
    
    return res.json(updatedSettings)
  } catch (error: any) {
    console.error('Error updating settings:', error)
    console.error('Error details:', error.message)
    console.error('Stack trace:', error.stack)
    return res.status(500).json({ 
      error: 'Failed to update settings',
      details: error.message 
    })
  }
})

// Get permissions configuration
router.get('/permissions/config', async (req: Request, res: Response) => {
  try {
    const configPath = path.join(__dirname, '../../../permissions.json')
    const config = await fs.readFile(configPath, 'utf8')
    res.json(JSON.parse(config))
  } catch (error) {
    console.error('Error fetching permissions config:', error)
    res.status(500).json({ error: 'Failed to fetch permissions config' })
  }
})

export default router