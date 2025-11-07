'use client'

import { useState } from 'react'

interface PreferencePage3Props {
  onNext: (preferences: { sleepSchedule: string }) => void
  initialSleepSchedule: string
}

export default function PreferencePage3({ onNext, initialSleepSchedule }: PreferencePage3Props) {
  const [sleepSchedule, setSleepSchedule] = useState(initialSleepSchedule || '')
  const [error, setError] = useState('')

  const sleepOptions = [
    {
      value: 'before-11pm',
      label: 'Early Bird',
      description: 'I go to bed before 11pm',
      icon: '🌅',
    },
    {
      value: '11pm-1am',
      label: 'Night Owl',
      description: 'Between 11pm - 1am',
      icon: '🌙',
    },
    {
      value: 'after-1am',
      label: 'Night Creature',
      description: 'After 1am',
      icon: '🦉',
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sleepSchedule) {
      setError('Please select your sleep schedule')
      return
    }
    setError('')
    onNext({ sleepSchedule })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-reelty-primary to-reelty-secondary mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What's your sleep schedule?</h1>
        <p className="text-gray-600">Help us find roommates with compatible sleep patterns</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sleep Schedule Options */}
        <div className="space-y-3">
          {sleepOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSleepSchedule(option.value)
                setError('')
              }}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                sleepSchedule === option.value
                  ? 'border-reelty-primary bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transform scale-[1.02]'
                  : 'border-gray-200 hover:border-reelty-primary hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="text-4xl mr-4">{option.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{option.label}</h3>
                  <p className="text-gray-600">{option.description}</p>
                </div>
                {sleepSchedule === option.value && (
                  <div className="ml-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-reelty-primary to-reelty-secondary flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm flex items-center bg-red-50 p-3 rounded-lg border border-red-200">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Additional Info */}
        {sleepSchedule && (
          <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                We'll prioritize matching you with roommates who have similar sleep schedules to minimize disruptions.
              </span>
            </div>
          </div>
        )}

        {/* Next Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-reelty-primary to-reelty-secondary text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
