import { formatDistanceToNow, format } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import type { Language } from '../contexts/LanguageContext'

// Convert date to Japan timezone for consistent display
function toJapanTime(date: Date | string): Date {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(targetDate.getTime())) {
    console.warn('Invalid date provided to toJapanTime:', date)
    return new Date() // Return current date as fallback
  }
  
  // Since the backend is already in Asia/Tokyo timezone, we don't need additional conversion
  // The database timestamps are already in JST, so just return the date as-is
  return targetDate
}

export function formatRelativeTime(date: Date | string, language: Language = 'ja'): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(targetDate.getTime())) {
    console.warn('Invalid date provided to formatRelativeTime:', date)
    return language === 'ja' ? '無効な日付' : 'Invalid date'
  }
  
  const now = new Date()
  
  // Ensure both dates are in the same timezone context
  const japanTargetDate = toJapanTime(targetDate)
  const japanNow = toJapanTime(now)
  
  const diffInMilliseconds = japanNow.getTime() - japanTargetDate.getTime()
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60))
  
  const locale = language === 'ja' ? ja : enUS
  
  // Handle future dates (negative diff)
  if (diffInMilliseconds < 0) {
    const futureDiffInMinutes = Math.abs(diffInMinutes)
    if (futureDiffInMinutes < 60) {
      return language === 'ja' ? `${futureDiffInMinutes}分後` : `in ${futureDiffInMinutes} minute${futureDiffInMinutes === 1 ? '' : 's'}`
    } else if (futureDiffInMinutes < 24 * 60) {
      const hours = Math.floor(futureDiffInMinutes / 60)
      return language === 'ja' ? `${hours}時間後` : `in ${hours} hour${hours === 1 ? '' : 's'}`
    }
    return formatDistanceToNow(japanTargetDate, {
      addSuffix: true,
      locale,
    })
  }
  
  // Handle past dates
  if (diffInMinutes < 1) {
    return language === 'ja' ? 'たった今' : 'just now'
  } else if (diffInMinutes < 60) {
    return language === 'ja' ? `${diffInMinutes}分前` : `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60)
    return language === 'ja' ? `${hours}時間前` : `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else {
    return formatDistanceToNow(japanTargetDate, {
      addSuffix: true,
      locale,
    })
  }
}

// Format date in Japan timezone with proper localization
export function formatDate(date: Date | string, language: Language = 'ja', formatString?: string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(targetDate.getTime())) {
    console.warn('Invalid date provided to formatDate:', date)
    return language === 'ja' ? '無効な日付' : 'Invalid date'
  }
  
  const japanDate = toJapanTime(targetDate)
  
  const locale = language === 'ja' ? ja : enUS
  const defaultFormat = language === 'ja' ? 'yyyy/MM/dd HH:mm' : 'MMM dd, yyyy HH:mm'
  
  return format(japanDate, formatString || defaultFormat, { locale })
}