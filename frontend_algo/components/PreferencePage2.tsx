'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface PreferencePage2Props {
  onNext: (preferences: { location: string; latitude?: number; longitude?: number }) => void
  initialLocation: string
  initialLatitude?: number
  initialLongitude?: number
}

export default function PreferencePage2({ onNext, initialLocation, initialLatitude, initialLongitude }: PreferencePage2Props) {
  const [location, setLocation] = useState(initialLocation || '')
  const [latitude, setLatitude] = useState<number | undefined>(initialLatitude)
  const [longitude, setLongitude] = useState<number | undefined>(initialLongitude)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    const initAutocomplete = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places'],
      })

      try {
        await loader.load()
        
        if (inputRef.current && window.google) {
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['address', 'geocode'],
            fields: ['formatted_address', 'geometry', 'name'],
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (place.formatted_address) {
              setLocation(place.formatted_address)
              if (place.geometry?.location) {
                setLatitude(place.geometry.location.lat())
                setLongitude(place.geometry.location.lng())
              }
              setSuggestions([])
              setShowSuggestions(false)
            }
          })

          autocompleteRef.current = autocomplete
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        setError('Unable to load location services. Please enter your location manually.')
      }
    }

    initAutocomplete()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) {
      setError('Please enter a location')
      return
    }
    setError('')
    onNext({ location, latitude, longitude })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-reelty-primary to-reelty-secondary mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Where do you want to live?</h1>
        <p className="text-gray-600">Enter your preferred location or neighborhood</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location Input */}
        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              id="location"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setError('')
              }}
              placeholder="Search for a city, address, or neighborhood..."
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-reelty-primary focus:ring-2 focus:ring-reelty-primary focus:ring-opacity-20 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm flex items-center mt-2">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {location && (
            <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  We'll match you with roommates in this area. You can always update this later in settings.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Map Preview Placeholder */}
        {latitude && longitude && (
          <div className="bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 h-64 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <svg className="w-16 h-16 mx-auto mb-2 text-reelty-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-sm">Map preview would be displayed here</p>
              <p className="text-xs text-gray-500 mt-1">Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}</p>
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

      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Setup required:</strong> Add your Google Maps API key to <code className="bg-yellow-100 px-1 rounded">.env.local</code> as <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
          </p>
        </div>
      )}
    </div>
  )
}
