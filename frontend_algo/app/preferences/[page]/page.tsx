'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import PreferencePage1 from '@/components/PreferencePage1'
import PreferencePage2 from '@/components/PreferencePage2'
import PreferencePage3 from '@/components/PreferencePage3'
import PreferencePage4 from '@/components/PreferencePage4'

interface UserPreferences {
  budget: number
  location: string
  latitude?: number
  longitude?: number
  sleepSchedule: string
  numberOfRoommates: number
}

export default function PreferenceFlow() {
  const params = useParams()
  const router = useRouter()
  const pageNumber = parseInt(params.page as string, 10)

  const [preferences, setPreferences] = useState<UserPreferences>({
    budget: 0,
    location: '',
    sleepSchedule: '',
    numberOfRoommates: 1,
  })

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('reelty_preferences')
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }
  }, [])

  const handleNext = (updatedPreferences: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updatedPreferences }
    setPreferences(newPreferences)
    
    // Save to localStorage
    localStorage.setItem('reelty_preferences', JSON.stringify(newPreferences))

    if (pageNumber < 4) {
      router.push(`/preferences/${pageNumber + 1}`)
    } else {
      // Last page - redirect to completion
      router.push('/preferences/complete')
    }
  }

  const handleBack = () => {
    if (pageNumber > 1) {
      router.push(`/preferences/${pageNumber - 1}`)
    }
  }

  const renderPage = () => {
    switch (pageNumber) {
      case 1:
        return <PreferencePage1 onNext={handleNext} initialBudget={preferences.budget} />
      case 2:
        return <PreferencePage2 onNext={handleNext} initialLocation={preferences.location} initialLatitude={preferences.latitude} initialLongitude={preferences.longitude} />
      case 3:
        return <PreferencePage3 onNext={handleNext} initialSleepSchedule={preferences.sleepSchedule} />
      case 4:
        return <PreferencePage4 onNext={handleNext} initialNumberOfRoommates={preferences.numberOfRoommates} />
      default:
        return <div>Invalid page</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Step {pageNumber} of 4</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((pageNumber / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-reelty-primary to-reelty-secondary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(pageNumber / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Back Button */}
        {pageNumber > 1 && (
          <button
            onClick={handleBack}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}

        {/* Page Content */}
        {renderPage()}
      </div>
    </div>
  )
}
