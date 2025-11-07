'use client'

import { useState } from 'react'

interface PreferencePage1Props {
  onNext: (preferences: { budget: number }) => void
  initialBudget: number
}

export default function PreferencePage1({ onNext, initialBudget }: PreferencePage1Props) {
  const [budget, setBudget] = useState(initialBudget || 1500)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (budget < 300) {
      setError('Budget must be at least $300')
      return
    }
    if (budget > 10000) {
      setError('Budget cannot exceed $10,000')
      return
    }
    setError('')
    onNext({ budget })
  }

  const budgetRanges = [
    { label: '$300-$800', value: 550 },
    { label: '$800-$1,200', value: 1000 },
    { label: '$1,200-$1,800', value: 1500 },
    { label: '$1,800-$2,500', value: 2150 },
    { label: '$2,500-$3,500', value: 3000 },
    { label: '$3,500+', value: 4000 },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-reelty-primary to-reelty-secondary mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What's your monthly budget?</h1>
        <p className="text-gray-600">Set your rent budget to find compatible roommates</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">${budget.toLocaleString()}/month</span>
            {budget >= 300 && budget <= 10000 && (
              <span className="text-sm text-green-600 font-medium">✓ Valid</span>
            )}
          </div>
          
          <input
            type="range"
            min="300"
            max="10000"
            step="50"
            value={budget}
            onChange={(e) => {
              setBudget(Number(e.target.value))
              setError('')
            }}
            className="w-full h-3 bg-gradient-to-r from-reelty-primary to-reelty-secondary rounded-lg appearance-none cursor-pointer slider"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>$300</span>
            <span>$10,000</span>
          </div>

          {error && (
            <div className="text-red-600 text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Quick Select Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Or choose a range:</label>
          <div className="grid grid-cols-2 gap-3">
            {budgetRanges.map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => {
                  setBudget(range.value)
                  setError('')
                }}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  budget === range.value
                    ? 'border-reelty-primary bg-gradient-to-br from-reelty-primary to-reelty-secondary text-white shadow-lg'
                    : 'border-gray-200 hover:border-reelty-primary text-gray-700 hover:bg-purple-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-reelty-primary to-reelty-secondary text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Continue
        </button>
      </form>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          border: none;
        }
      `}</style>
    </div>
  )
}
