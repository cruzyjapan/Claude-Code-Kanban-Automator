import React, { useState } from 'react'
import { Feedback } from '../types/index'
import { formatDate } from '../utils/dateUtils'
import { CheckCircleIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../contexts/LanguageContext'
import ReactMarkdown from 'react-markdown'

interface FeedbackSectionProps {
  feedbacks: Feedback[]
  onAddFeedback: (content: string) => void
  canAddFeedback: boolean
}

export default function FeedbackSection({ feedbacks, onAddFeedback, canAddFeedback }: FeedbackSectionProps) {
  const [newFeedback, setNewFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t, language } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedback.trim()) return

    setIsSubmitting(true)
    try {
      await onAddFeedback(newFeedback)
      setNewFeedback('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Add feedback form */}
      {canAddFeedback && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t('feedback.add')}</h3>
          <form onSubmit={handleSubmit}>
            <textarea
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
              rows={4}
              placeholder={t('feedback.placeholder')}
              disabled={isSubmitting}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={!newFeedback.trim() || isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                {isSubmitting ? t('feedback.sending') : t('feedback.send')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{t('feedback.history')}</h3>
        
        {feedbacks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
{t('feedback.empty')}
          </p>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="border-l-4 border-gray-200 dark:border-gray-600 pl-4 py-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {formatDate(feedback.created_at, language)}
                      </span>
                      {feedback.addressed && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircleIcon className="w-4 h-4" />
{t('feedback.addressed')} (v{feedback.addressed_version})
                        </span>
                      )}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{feedback.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}