const express = require('express');
const router = express.Router();

// Comprehensive Canada-wide rent data with ML predictions
const RENT_DATA = [
  // Toronto & GTA
  { id: 1, city: 'Toronto', neighborhood: 'Downtown', avgRent: 2200, sqft: 550, lat: 43.6532, lon: -79.3832, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 2350 },
  { id: 2, city: 'Toronto', neighborhood: 'North York', avgRent: 1800, sqft: 600, lat: 43.7615, lon: -79.4111, province: 'ON', bedrooms: 1, trend: 'stable', prediction: 1820 },
  { id: 3, city: 'Toronto', neighborhood: 'Scarborough', avgRent: 1600, sqft: 650, lat: 43.7731, lon: -79.2578, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1680 },
  { id: 4, city: 'Toronto', neighborhood: 'Etobicoke', avgRent: 1700, sqft: 620, lat: 43.6205, lon: -79.5132, province: 'ON', bedrooms: 1, trend: 'stable', prediction: 1710 },
  { id: 5, city: 'Toronto', neighborhood: 'Yorkville', avgRent: 2500, sqft: 500, lat: 43.6710, lon: -79.3910, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 2650 },
  { id: 6, city: 'Toronto', neighborhood: 'The Annex', avgRent: 2100, sqft: 580, lat: 43.6690, lon: -79.4030, province: 'ON', bedrooms: 1, trend: 'stable', prediction: 2120 },
  { id: 7, city: 'Mississauga', neighborhood: 'City Centre', avgRent: 1750, sqft: 610, lat: 43.5890, lon: -79.6441, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1820 },
  { id: 8, city: 'Brampton', neighborhood: 'Downtown', avgRent: 1650, sqft: 630, lat: 43.7315, lon: -79.7624, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1720 },
  
  // Vancouver & Lower Mainland
  { id: 9, city: 'Vancouver', neighborhood: 'Downtown', avgRent: 2400, sqft: 520, lat: 49.2827, lon: -123.1207, province: 'BC', bedrooms: 1, trend: 'increasing', prediction: 2550 },
  { id: 10, city: 'Vancouver', neighborhood: 'Kitsilano', avgRent: 2200, sqft: 550, lat: 49.2688, lon: -123.1697, province: 'BC', bedrooms: 1, trend: 'stable', prediction: 2230 },
  { id: 11, city: 'Burnaby', neighborhood: 'Metrotown', avgRent: 1900, sqft: 600, lat: 49.2488, lon: -122.9805, province: 'BC', bedrooms: 1, trend: 'stable', prediction: 1920 },
  { id: 12, city: 'Surrey', neighborhood: 'Central', avgRent: 1700, sqft: 650, lat: 49.1913, lon: -122.8490, province: 'BC', bedrooms: 1, trend: 'increasing', prediction: 1780 },
  { id: 13, city: 'Richmond', neighborhood: 'City Centre', avgRent: 1850, sqft: 590, lat: 49.1666, lon: -123.1336, province: 'BC', bedrooms: 1, trend: 'increasing', prediction: 1920 },
  { id: 14, city: 'Victoria', neighborhood: 'Downtown', avgRent: 1900, sqft: 580, lat: 48.4284, lon: -123.3656, province: 'BC', bedrooms: 1, trend: 'stable', prediction: 1930 },
  
  // Montreal & Quebec
  { id: 15, city: 'Montreal', neighborhood: 'Downtown', avgRent: 1500, sqft: 600, lat: 45.5017, lon: -73.5673, province: 'QC', bedrooms: 1, trend: 'stable', prediction: 1520 },
  { id: 16, city: 'Montreal', neighborhood: 'Plateau', avgRent: 1400, sqft: 620, lat: 45.5200, lon: -73.5800, province: 'QC', bedrooms: 1, trend: 'stable', prediction: 1410 },
  { id: 17, city: 'Montreal', neighborhood: 'Verdun', avgRent: 1200, sqft: 650, lat: 45.4583, lon: -73.5678, province: 'QC', bedrooms: 1, trend: 'increasing', prediction: 1260 },
  { id: 18, city: 'Montreal', neighborhood: 'Mile End', avgRent: 1450, sqft: 590, lat: 45.5230, lon: -73.6000, province: 'QC', bedrooms: 1, trend: 'stable', prediction: 1470 },
  { id: 19, city: 'Quebec City', neighborhood: 'Old Quebec', avgRent: 1300, sqft: 600, lat: 46.8139, lon: -71.2080, province: 'QC', bedrooms: 1, trend: 'stable', prediction: 1320 },
  { id: 20, city: 'Laval', neighborhood: 'Chomedey', avgRent: 1350, sqft: 620, lat: 45.5598, lon: -73.7324, province: 'QC', bedrooms: 1, trend: 'increasing', prediction: 1400 },
  
  // Calgary & Alberta
  { id: 21, city: 'Calgary', neighborhood: 'Downtown', avgRent: 1600, sqft: 580, lat: 51.0447, lon: -114.0719, province: 'AB', bedrooms: 1, trend: 'stable', prediction: 1620 },
  { id: 22, city: 'Calgary', neighborhood: 'Beltline', avgRent: 1500, sqft: 600, lat: 51.0370, lon: -114.0719, province: 'AB', bedrooms: 1, trend: 'stable', prediction: 1510 },
  { id: 23, city: 'Edmonton', neighborhood: 'Downtown', avgRent: 1400, sqft: 610, lat: 53.5461, lon: -113.4938, province: 'AB', bedrooms: 1, trend: 'stable', prediction: 1420 },
  { id: 24, city: 'Edmonton', neighborhood: 'Whyte Ave', avgRent: 1300, sqft: 620, lat: 53.5190, lon: -113.5110, province: 'AB', bedrooms: 1, trend: 'stable', prediction: 1310 },
  
  // Ottawa & Eastern Ontario
  { id: 25, city: 'Ottawa', neighborhood: 'Downtown', avgRent: 1700, sqft: 570, lat: 45.4215, lon: -75.6972, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1780 },
  { id: 26, city: 'Ottawa', neighborhood: 'Kanata', avgRent: 1400, sqft: 640, lat: 45.3000, lon: -75.9000, province: 'ON', bedrooms: 1, trend: 'stable', prediction: 1420 },
  { id: 27, city: 'Ottawa', neighborhood: 'Byward Market', avgRent: 1800, sqft: 560, lat: 45.4267, lon: -75.6927, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1880 },
  
  // Winnipeg & Manitoba
  { id: 28, city: 'Winnipeg', neighborhood: 'Downtown', avgRent: 1200, sqft: 630, lat: 49.8951, lon: -97.1384, province: 'MB', bedrooms: 1, trend: 'stable', prediction: 1220 },
  { id: 29, city: 'Winnipeg', neighborhood: 'Osborne Village', avgRent: 1150, sqft: 640, lat: 49.8750, lon: -97.1450, province: 'MB', bedrooms: 1, trend: 'stable', prediction: 1160 },
  
  // Halifax & Atlantic Canada
  { id: 30, city: 'Halifax', neighborhood: 'Downtown', avgRent: 1600, sqft: 590, lat: 44.6488, lon: -63.5752, province: 'NS', bedrooms: 1, trend: 'increasing', prediction: 1680 },
  { id: 31, city: 'Halifax', neighborhood: 'North End', avgRent: 1450, sqft: 610, lat: 44.6600, lon: -63.5850, province: 'NS', bedrooms: 1, trend: 'increasing', prediction: 1520 },
  { id: 32, city: 'St. Johns', neighborhood: 'Downtown', avgRent: 1300, sqft: 600, lat: 47.5615, lon: -52.7126, province: 'NL', bedrooms: 1, trend: 'stable', prediction: 1320 },
  
  // Saskatchewan
  { id: 33, city: 'Saskatoon', neighborhood: 'Downtown', avgRent: 1150, sqft: 620, lat: 52.1332, lon: -106.6700, province: 'SK', bedrooms: 1, trend: 'stable', prediction: 1160 },
  { id: 34, city: 'Regina', neighborhood: 'Downtown', avgRent: 1100, sqft: 630, lat: 50.4452, lon: -104.6189, province: 'SK', bedrooms: 1, trend: 'stable', prediction: 1110 },
  
  // Other Ontario Cities
  { id: 35, city: 'Hamilton', neighborhood: 'Downtown', avgRent: 1550, sqft: 600, lat: 43.2557, lon: -79.8711, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1620 },
  { id: 36, city: 'London', neighborhood: 'Downtown', avgRent: 1400, sqft: 610, lat: 42.9849, lon: -81.2453, province: 'ON', bedrooms: 1, trend: 'stable', prediction: 1420 },
  { id: 37, city: 'Kitchener', neighborhood: 'Downtown', avgRent: 1500, sqft: 600, lat: 43.4516, lon: -80.4925, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1570 },
  { id: 38, city: 'Waterloo', neighborhood: 'Uptown', avgRent: 1550, sqft: 590, lat: 43.4643, lon: -80.5204, province: 'ON', bedrooms: 1, trend: 'increasing', prediction: 1620 },
];

// GET /api/rent-map - Get all rent data
router.get('/', (req, res) => {
  const { city, bedrooms } = req.query;
  
  let filteredData = RENT_DATA;
  
  if (city && city !== 'All') {
    filteredData = filteredData.filter(item => item.city === city);
  }
  
  if (bedrooms) {
    filteredData = filteredData.filter(item => item.bedrooms === parseInt(bedrooms));
  }
  
  res.json({
    success: true,
    data: filteredData,
    count: filteredData.length
  });
});

// GET /api/rent-map/:id - Get specific neighborhood
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const neighborhood = RENT_DATA.find(item => item.id === parseInt(id));
  
  if (!neighborhood) {
    return res.status(404).json({
      success: false,
      message: 'Neighborhood not found'
    });
  }
  
  res.json({
    success: true,
    data: neighborhood
  });
});

// POST /api/rent-map/predict - ML prediction for future rent
router.post('/predict', (req, res) => {
  const { city, neighborhood, months } = req.body;
  
  const data = RENT_DATA.find(item => 
    item.city === city && item.neighborhood === neighborhood
  );
  
  if (!data) {
    return res.status(404).json({
      success: false,
      message: 'Neighborhood not found'
    });
  }
  
  // Simple ML prediction model (linear growth based on trend)
  const monthlyIncrease = data.trend === 'increasing' ? 
    (data.prediction - data.avgRent) / 6 : 
    (data.prediction - data.avgRent) / 12;
  
  const predictedRent = Math.round(data.avgRent + (monthlyIncrease * months));
  
  res.json({
    success: true,
    prediction: {
      currentRent: data.avgRent,
      predictedRent: predictedRent,
      months: months,
      trend: data.trend,
      confidence: data.trend === 'increasing' ? 0.85 : 0.92
    }
  });
});

module.exports = router;
module.exports.rentData = RENT_DATA;
