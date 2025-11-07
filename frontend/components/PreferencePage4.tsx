'use client'

import { useState } from 'react'

interface PreferencePage4Props {
  onNext: (preferences: { numberOfRoommates: number }) => void
  initialNumberOfRoommates: number
}

export default function PreferencePage4({ onNext, initialNumberOfRoommates }: PreferencePage4Props) {
  const [numberOfRoommates, setNumberOfRoommates] = useState(initialNumberOfRoommates || 1)
  const [error, setError] = useState('')

  const roommateOptions = [
    { value: 1, label: '1 Roommate', description: 'Just you and me', emoji: '👥' },
    { value: 2, label: '2 Roommates', description: 'Three\'s company', emoji: '👥👥' },
    { value: 3, label: '3 Roommates', description: 'Four\'s a crowd', emoji: '👥👥👥' },
    { value: 4, label: '4 Roommates', description: 'Five\'s a party', emoji: '👥👥👥👥' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!numberOfRoommates || numberOfRoommates < 1 || numberOfRoommates > 4) {
      setError('Please select a valid number of roommates')
      return
    }
    setError('')
    onNext({ numberOfRoommates })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-reelty-primary to-reelty-secondary mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">How many roommates?</h1>
        <p className="text-gray-600">How many roommates are you looking for?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Number of Roommates Options */}
        <div className="grid grid-cols-2 gap-4">
          {roommateOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setNumberOfRoommates(option.value)
                setError('')
              }}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                numberOfRoommates === option.value
                  ? 'border-reelty-primary bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transform scale-[1.02]'
                  : 'border-gray-200 hover:border-reelty-primary hover:bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{option.emoji}</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{option.label}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
                {numberOfRoommates === option.value && (
                  <div className="mt-3">
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-reelty-primary to-reelty-secondary">
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
        {numberOfRoommates && (
          <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                We'll find groups that match your preferred number, including other people looking for the same setup.
              </span>
            </div>
          </div>
        )}

        {/* Next Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-reelty-primary to-reelty-secondary text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Complete Setup
        </button>
      </form>
    </div>
  )
}
