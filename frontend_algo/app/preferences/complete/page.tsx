'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserPreferences {
  budget: number
  location: string
  latitude?: number
  longitude?: number
  sleepSchedule: string
  numberOfRoommates: number
}

export default function CompletePage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('reelty_preferences')
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    } else {
      // If no preferences found, redirect to start
      router.push('/preferences/1')
    }
  }, [router])

  const handleReset = () => {
    localStorage.removeItem('reelty_preferences')
    router.push('/preferences/1')
  }

  const getSleepLabel = (value: string) => {
    switch (value) {
      case 'before-11pm':
        return 'Early Bird (Before 11pm)'
      case '11pm-1am':
        return 'Night Owl (11pm - 1am)'
      case 'after-1am':
        return 'Night Creature (After 1am)'
      default:
        return value
    }
  }

  if (!preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-reelty-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 animate-scale">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">All Set! 🎉</h1>
            <p className="text-gray-600 text-lg">Your preferences have been saved</p>
          </div>

          {/* Summary of Preferences */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Preferences</h2>
            <div className="space-y-4">
              {/* Budget */}
              <div className="flex items-start bg-white rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-reelty-primary bg-opacity-10 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-reelty-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
                  <p className="text-gray-600">${preferences.budget.toLocaleString()}/month</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start bg-white rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-reelty-primary bg-opacity-10 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-reelty-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                  <p className="text-gray-600">{preferences.location || 'Not specified'}</p>
                </div>
              </div>

              {/* Sleep Schedule */}
              <div className="flex items-start bg-white rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-reelty-primary bg-opacity-10 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-reelty-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Sleep Schedule</h3>
                  <p className="text-gray-600">{getSleepLabel(preferences.sleepSchedule)}</p>
                </div>
              </div>

              {/* Number of Roommates */}
              <div className="flex items-start bg-white rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-reelty-primary bg-opacity-10 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-reelty-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Roommates</h3>
                  <p className="text-gray-600">{preferences.numberOfRoommates} {preferences.numberOfRoommates === 1 ? 'roommate' : 'roommates'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/preferences/1')}
              className="w-full bg-gradient-to-r from-reelty-primary to-reelty-secondary text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Edit Preferences
            </button>
            <button
              onClick={handleReset}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              Start Over
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Your preferences are saved in localStorage. In a real app, these would be sent to your backend server.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

<style>{`
  @keyframes scale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  .animate-scale {
    animation: scale 0.6s ease-in-out;
  }
`}</style>
