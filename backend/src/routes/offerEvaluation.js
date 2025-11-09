const express = require('express');
const router = express.Router();

// Import rent data for comparison
const rentData = require('./rentMap').rentData;

// ML Model for Offer Evaluation based on neighborhood comparison
class OfferEvaluationModel {
  constructor() {
    this.rentData = rentData;
    // Calculate market averages from actual rent data
    this.marketAverages = this.calculateMarketAverages();
    console.log('📊 Market Averages Calculated from Rent Map Data:');
    console.log('   Price per sqft:', this.marketAverages.pricePerSqft);
    console.log('   Average rent by bedrooms:', this.marketAverages.rent);
  }

  // Calculate real market averages from rent data
  calculateMarketAverages() {
    if (!this.rentData || this.rentData.length === 0) {
      console.warn('⚠️  No rent data available, using fallback values');
      return {
        pricePerSqft: 2.7,
        rent: {
          1: 1550,
          2: 2100,
          3: 2800
        }
      };
    }

    console.log(`📊 Calculating market averages from ${this.rentData.length} data points...`);
    
    const rentByBedrooms = {};
    const sqftByBedrooms = {};
    
    // Group by bedrooms
    this.rentData.forEach(item => {
      const beds = item.bedrooms;
      if (!rentByBedrooms[beds]) {
        rentByBedrooms[beds] = [];
        sqftByBedrooms[beds] = [];
      }
      rentByBedrooms[beds].push(item.avgRent);
      sqftByBedrooms[beds].push(item.sqft);
    });
    
    // Calculate averages
    const rent = {};
    let totalPricePerSqft = 0;
    let count = 0;
    
    Object.keys(rentByBedrooms).forEach(beds => {
      const avgRent = rentByBedrooms[beds].reduce((a, b) => a + b, 0) / rentByBedrooms[beds].length;
      const avgSqft = sqftByBedrooms[beds].reduce((a, b) => a + b, 0) / sqftByBedrooms[beds].length;
      rent[beds] = Math.round(avgRent);
      
      // Calculate price per sqft
      const pricePerSqft = avgRent / avgSqft;
      totalPricePerSqft += pricePerSqft;
      count++;
      
      console.log(`   ${beds} bedroom(s): $${rent[beds]}/month avg, ${Math.round(avgSqft)} sqft avg, $${pricePerSqft.toFixed(2)}/sqft`);
    });
    
    const avgPricePerSqft = parseFloat((totalPricePerSqft / count).toFixed(2));
    
    return {
      pricePerSqft: avgPricePerSqft,
      rent: rent
    };
  }
  
  // Normalize features
  normalize(value, min, max) {
    return (value - min) / (max - min);
  }
  
  // Calculate base score - COMPREHENSIVE ANALYSIS
  calculateBaseScore(features) {
    let score = 30; // Start at 30 (lower baseline)
    let breakdown = {};
    
    // 1. Price per sqft analysis - MUCH STRICTER
    const pricePerSqft = features.monthlyRent / features.squareFeet;
    let priceScore = 0;
    if (pricePerSqft < 2.0) priceScore = 25;
    else if (pricePerSqft < 2.5) priceScore = 15;
    else if (pricePerSqft < 3.0) priceScore = 8;
    else if (pricePerSqft < 3.5) priceScore = 3;
    else if (pricePerSqft < 4.0) priceScore = -5;
    else priceScore = -15;
    score += priceScore;
    breakdown.pricePerSqft = { score: priceScore, value: pricePerSqft.toFixed(2) };
    
    // 2. Utilities analysis
    let utilityScore = 0;
    if (features.utilities === 'included') utilityScore = 10;
    else if (features.utilitiesCost < 100) utilityScore = 4;
    else utilityScore = -3;
    score += utilityScore;
    breakdown.utilities = { score: utilityScore, included: features.utilities === 'included' };
    
    // 3. Amenities scoring
    let amenitiesScore = 0;
    if (features.parking === 'yes') amenitiesScore += 5;
    if (features.laundry === 'in-unit') amenitiesScore += 8;
    else if (features.laundry === 'in-building') amenitiesScore += 3;
    else amenitiesScore -= 2;
    if (features.petFriendly === 'yes') amenitiesScore += 3;
    if (features.furnished === 'yes') amenitiesScore += 5;
    score += amenitiesScore;
    breakdown.amenities = { score: amenitiesScore };
    
    // 4. Lease term flexibility
    let leaseScore = 0;
    if (features.leaseTerm === '12') leaseScore = 4;
    else if (features.leaseTerm === '6') leaseScore = 2;
    else if (features.leaseTerm === '24') leaseScore = -3;
    score += leaseScore;
    breakdown.leaseTerm = { score: leaseScore, months: features.leaseTerm };
    
    // 5. Space efficiency (bed/bath ratio)
    const ratio = features.bathrooms / features.bedrooms;
    let spaceScore = 0;
    if (ratio >= 1) spaceScore = 3;
    else spaceScore = -2;
    score += spaceScore;
    breakdown.spaceEfficiency = { score: spaceScore, ratio: ratio.toFixed(2) };
    
    // 6. NEW: Location quality (if provided)
    if (features.location) {
      let locationScore = this.analyzeLocation(features.location);
      score += locationScore;
      breakdown.location = { score: locationScore };
    }
    
    // 7. NEW: Building age and condition
    if (features.buildingAge) {
      let ageScore = 0;
      if (features.buildingAge < 5) ageScore = 5; // New building
      else if (features.buildingAge < 15) ageScore = 3;
      else if (features.buildingAge < 30) ageScore = 0;
      else ageScore = -3; // Old building
      score += ageScore;
      breakdown.buildingAge = { score: ageScore, years: features.buildingAge };
    }
    
    // 8. NEW: Security features
    if (features.security) {
      let securityScore = 0;
      if (features.security.includes('doorman')) securityScore += 3;
      if (features.security.includes('cameras')) securityScore += 2;
      if (features.security.includes('secure-entry')) securityScore += 2;
      score += securityScore;
      breakdown.security = { score: securityScore };
    }
    
    return {
      total: Math.min(100, Math.max(0, score)),
      breakdown: breakdown
    };
  }
  
  // NEW: Analyze location quality
  analyzeLocation(location) {
    let score = 0;
    const locationLower = location.toLowerCase();
    
    // Check for desirable areas
    const premiumAreas = ['downtown', 'central', 'waterfront', 'university'];
    if (premiumAreas.some(area => locationLower.includes(area))) score += 5;
    
    // Check for transit access
    if (locationLower.includes('subway') || locationLower.includes('metro') || locationLower.includes('transit')) {
      score += 3;
    }
    
    return score;
  }
  
  // ML prediction with confidence - COMPREHENSIVE ANALYSIS
  predict(features) {
    const baseScoreResult = this.calculateBaseScore(features);
    const baseScore = baseScoreResult.total;
    
    // Calculate market comparison
    const marketAvg = this.marketAverages.rent[features.bedrooms] || 2000;
    const priceDiff = ((features.monthlyRent - marketAvg) / marketAvg) * 100;
    
    // Adjust score based on market - MUCH MORE AGGRESSIVE
    let adjustedScore = baseScore;
    if (priceDiff < -20) adjustedScore += 15; // Exceptional deal
    else if (priceDiff < -10) adjustedScore += 10; // Great deal
    else if (priceDiff < 0) adjustedScore += 5; // Good deal
    else if (priceDiff < 10) adjustedScore -= 5; // Slightly overpriced
    else if (priceDiff < 20) adjustedScore -= 15; // Overpriced
    else adjustedScore -= 25; // Very overpriced
    
    adjustedScore = Math.min(100, Math.max(0, adjustedScore));
    
    // Calculate confidence (based on data completeness)
    const dataCompleteness = this.calculateDataCompleteness(features);
    const confidence = 0.75 + (dataCompleteness * 0.20);
    
    // NEW: Calculate additional metrics
    const valueScore = this.calculateValueScore(features, marketAvg);
    const qualityScore = this.calculateQualityScore(features);
    const locationScore = features.location ? this.analyzeLocation(features.location) : 0;
    
    return {
      score: Math.round(adjustedScore),
      confidence: Math.round(confidence * 100),
      breakdown: baseScoreResult.breakdown,
      marketComparison: {
        marketAverage: marketAvg,
        yourOffer: features.monthlyRent,
        percentDifference: priceDiff.toFixed(1),
        isAboveMarket: features.monthlyRent > marketAvg,
        savings: marketAvg - features.monthlyRent
      },
      metrics: {
        valueScore: Math.round(valueScore),
        qualityScore: Math.round(qualityScore),
        locationScore: Math.round(locationScore),
        pricePerSqft: features.squareFeet ? 
          parseFloat((features.monthlyRent / features.squareFeet).toFixed(2)) : null
      }
    };
  }
  
  // NEW: Calculate value score
  calculateValueScore(features, marketAvg) {
    let score = 50;
    const priceDiff = ((features.monthlyRent - marketAvg) / marketAvg) * 100;
    
    // Price competitiveness
    if (priceDiff < -20) score += 30;
    else if (priceDiff < -10) score += 20;
    else if (priceDiff < 0) score += 10;
    else if (priceDiff > 20) score -= 30;
    else if (priceDiff > 10) score -= 20;
    
    // Included amenities add value
    if (features.utilities === 'included') score += 10;
    if (features.parking === 'yes') score += 5;
    if (features.furnished === 'yes') score += 5;
    
    return Math.min(100, Math.max(0, score));
  }
  
  // NEW: Calculate quality score
  calculateQualityScore(features) {
    let score = 50;
    
    // Space quality
    const pricePerSqft = features.monthlyRent / features.squareFeet;
    if (pricePerSqft < 2.5) score += 15;
    else if (pricePerSqft > 4.0) score -= 15;
    
    // Amenities quality
    if (features.laundry === 'in-unit') score += 10;
    if (features.parking === 'yes') score += 5;
    if (features.petFriendly === 'yes') score += 5;
    
    // Building quality
    if (features.buildingAge && features.buildingAge < 10) score += 10;
    if (features.security) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  // Calculate how complete the data is
  calculateDataCompleteness(features) {
    const requiredFields = [
      'monthlyRent', 'location', 'bedrooms', 'bathrooms',
      'utilities', 'parking', 'laundry', 'leaseTerm'
    ];
    
    const optionalFields = ['squareFeet', 'securityDeposit', 'petFriendly', 'furnished'];
    
    let score = 0;
    requiredFields.forEach(field => {
      if (features[field]) score += 0.6 / requiredFields.length;
    });
    
    optionalFields.forEach(field => {
      if (features[field]) score += 0.4 / optionalFields.length;
    });
    
    return score;
  }
  
  // Generate comprehensive recommendations
  generateRecommendations(score, features, prediction) {
    const recommendations = [];
    const actionItems = [];
    
    // Overall assessment
    if (score >= 75) {
      recommendations.push('⭐ Excellent offer! This property offers exceptional value for money.');
      recommendations.push('🏃 Act quickly - properties with this score typically get rented within 48 hours.');
      recommendations.push('📅 Schedule a viewing ASAP and be prepared to submit an application immediately.');
      actionItems.push('Prepare your documents (ID, proof of income, references)');
      actionItems.push('Have first and last month\'s rent ready');
    } else if (score >= 60) {
      recommendations.push('✅ Solid deal with good value. This is a competitive offer in the current market.');
      recommendations.push('💰 Try negotiating on utilities, parking, or a lower security deposit.');
      recommendations.push('🔍 Verify neighborhood safety, transit access, and nearby amenities before committing.');
      actionItems.push('Research the neighborhood crime statistics');
      actionItems.push('Test your commute during rush hour');
    } else if (score >= 45) {
      recommendations.push('⚠️ Average offer with room for improvement. You can likely find better value.');
      recommendations.push('💬 Negotiate the rent down by 5-10% or ask for included utilities/parking.');
      recommendations.push('📊 Compare with at least 3-5 similar properties in the area before deciding.');
      actionItems.push('Get quotes from 3+ other properties');
      actionItems.push('Calculate total monthly costs including utilities');
    } else if (score >= 30) {
      recommendations.push('❌ Below average - this property is overpriced for what it offers.');
      recommendations.push('🔄 Consider other options first. Only proceed if you can negotiate significantly better terms.');
      recommendations.push('📉 Ask for 10-15% rent reduction or substantial improvements to amenities.');
      actionItems.push('Expand your search radius');
      actionItems.push('Consider different neighborhoods');
    } else {
      recommendations.push('🚫 Poor value - strongly recommend looking elsewhere.');
      recommendations.push('⚠️ This offer is significantly overpriced or severely lacks basic amenities.');
      recommendations.push('🔍 Continue your search - better options exist within your budget.');
      actionItems.push('Reset your search criteria');
      actionItems.push('Consider roommates to afford better quality');
    }
    
    // Market-specific recommendations
    if (prediction.marketComparison.isAboveMarket) {
      const overprice = Math.abs(prediction.marketComparison.percentDifference);
      if (overprice > 15) {
        recommendations.push(`💸 This property is ${overprice.toFixed(0)}% above market average - significant overprice!`);
        actionItems.push(`Negotiate down by at least $${Math.round(prediction.marketComparison.savings * -1)}/month`);
      } else if (overprice > 5) {
        recommendations.push(`📈 Slightly above market average by ${overprice.toFixed(0)}%. Room for negotiation.`);
      }
    } else {
      const savings = prediction.marketComparison.savings;
      if (savings > 300) {
        recommendations.push(`💰 Excellent! You're saving $${Math.round(savings)}/month vs market average!`);
      } else if (savings > 100) {
        recommendations.push(`✅ Good deal - $${Math.round(savings)}/month below market average.`);
      }
    }
    
    // Specific feature recommendations
    if (features.utilities === 'not-included') {
      recommendations.push('💡 Utilities not included - budget an extra $100-200/month for hydro, heat, and internet.');
      actionItems.push('Ask landlord for average utility costs');
    }
    
    if (features.parking === 'no' && features.location) {
      recommendations.push('🚗 No parking - research street parking permits and availability in this area.');
      actionItems.push('Check municipal parking permit costs');
    }
    
    if (features.leaseTerm === '24') {
      recommendations.push('📅 2-year lease commitment - ensure you\'re comfortable with long-term stability.');
      actionItems.push('Negotiate for early termination clause');
    }
    
    if (features.leaseTerm === '6') {
      recommendations.push('⏰ Short 6-month lease - good flexibility but may face rent increase sooner.');
    }
    
    // Price per sqft recommendations
    if (prediction.metrics.pricePerSqft) {
      const psf = prediction.metrics.pricePerSqft;
      if (psf > 4.0) {
        recommendations.push(`📏 High price per sqft ($${psf}) - you\'re paying premium for space.`);
      } else if (psf < 2.5) {
        recommendations.push(`📏 Excellent price per sqft ($${psf}) - great space value!`);
      }
    }
    
    // Building age recommendations
    if (features.buildingAge) {
      if (features.buildingAge > 30) {
        recommendations.push('🏚️ Older building - inspect for maintenance issues, plumbing, and heating systems.');
        actionItems.push('Ask about recent renovations and repairs');
      } else if (features.buildingAge < 5) {
        recommendations.push('🏗️ New building - expect modern amenities and energy efficiency.');
      }
    }
    
    return {
      recommendations,
      actionItems
    };
  }
  
  // Generate pros and cons
  generateProsAndCons(features) {
    const pros = [];
    const cons = [];
    
    if (features.utilities === 'included') pros.push('Utilities included in rent');
    else cons.push('Utilities not included');
    
    if (features.parking === 'yes') pros.push('Parking available');
    else cons.push('No parking available');
    
    if (features.laundry === 'in-unit') pros.push('In-unit laundry');
    else if (features.laundry === 'in-building') pros.push('In-building laundry');
    else cons.push('No laundry facilities');
    
    if (features.petFriendly === 'yes') pros.push('Pet-friendly');
    else cons.push('Not pet-friendly');
    
    if (features.furnished === 'yes') pros.push('Fully furnished');
    
    if (features.leaseTerm === '12') pros.push('Standard 12-month lease');
    else if (features.leaseTerm === '24') cons.push('Long 24-month commitment');
    
    const pricePerSqft = features.squareFeet ? 
      features.monthlyRent / features.squareFeet : null;
    
    if (pricePerSqft && pricePerSqft < 3) {
      pros.push('Excellent price per square foot');
    } else if (pricePerSqft && pricePerSqft > 4) {
      cons.push('High price per square foot');
    }
    
    if (pros.length === 0) pros.push('Basic rental offering');
    if (cons.length === 0) cons.push('No major drawbacks identified');
    
    return { pros, cons };
  }
}

// Initialize model
const model = new OfferEvaluationModel();

// POST /api/offer-evaluation/evaluate - Evaluate an offer
router.post('/evaluate', (req, res) => {
  try {
    const features = {
      monthlyRent: parseFloat(req.body.monthlyRent),
      securityDeposit: parseFloat(req.body.securityDeposit) || 0,
      utilities: req.body.utilities,
      utilitiesCost: parseFloat(req.body.utilitiesCost) || 0,
      leaseTerm: req.body.leaseTerm,
      location: req.body.location,
      squareFeet: parseFloat(req.body.squareFeet) || 500,
      bedrooms: parseInt(req.body.bedrooms),
      bathrooms: parseFloat(req.body.bathrooms),
      parking: req.body.parking,
      laundry: req.body.laundry,
      petFriendly: req.body.petFriendly,
      furnished: req.body.furnished,
      buildingAge: parseInt(req.body.buildingAge) || null,
      security: req.body.security || null
    };
    
    // Validate required fields
    if (!features.monthlyRent || !features.location) {
      return res.status(400).json({
        success: false,
        message: 'Monthly rent and location are required'
      });
    }
    
    // Run ML model
    const prediction = model.predict(features);
    const { pros, cons } = model.generateProsAndCons(features);
    const recommendationResult = model.generateRecommendations(prediction.score, features, prediction);
    
    // Calculate total monthly cost
    const totalMonthlyCost = features.monthlyRent + 
      (features.utilities === 'not-included' ? features.utilitiesCost : 0);
    
    // Determine label - STRICTER THRESHOLDS
    let label;
    if (prediction.score >= 75) label = 'Excellent Deal';
    else if (prediction.score >= 60) label = 'Good Deal';
    else if (prediction.score >= 45) label = 'Average Deal';
    else if (prediction.score >= 30) label = 'Below Average';
    else label = 'Poor Deal';
    
    // Determine color - MORE GRADUAL
    let color;
    if (prediction.score >= 75) color = '#51cf66'; // Green
    else if (prediction.score >= 60) color = '#94d82d'; // Light green
    else if (prediction.score >= 45) color = '#ffd93d'; // Yellow
    else if (prediction.score >= 30) color = '#ff922b'; // Orange
    else color = '#ff6b6b'; // Red
    
    res.json({
      success: true,
      evaluation: {
        score: prediction.score,
        confidence: prediction.confidence,
        label,
        color,
        totalMonthlyCost,
        breakdown: prediction.breakdown,
        metrics: prediction.metrics,
        marketComparison: prediction.marketComparison,
        pros,
        cons,
        recommendations: recommendationResult.recommendations,
        actionItems: recommendationResult.actionItems,
        modelVersion: '2.0.0',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating offer',
      error: error.message
    });
  }
});

// GET /api/offer-evaluation/market-data - Get market averages
router.get('/market-data', (req, res) => {
  const { bedrooms, location } = req.query;
  
  res.json({
    success: true,
    marketData: {
      averageRent: model.marketAverages.rent[bedrooms] || 2000,
      averagePricePerSqft: model.marketAverages.pricePerSqft,
      location: location || 'General Market'
    }
  });
});

module.exports = router;
