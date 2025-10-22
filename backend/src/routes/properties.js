const express = require('express');
const router = express.Router();

// GET /api/properties
router.get('/', (req, res) => {
  // TODO: Implement property listing
  res.json({
    success: true,
    properties: [
      {
        id: 'property-1',
        title: 'Beautiful Apartment',
        price: 1200,
        location: 'Downtown',
        type: 'apartment',
        bedrooms: 2,
        bathrooms: 1
      }
    ]
  });
});

// GET /api/properties/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Implement single property retrieval
  res.json({
    success: true,
    property: {
      id,
      title: 'Beautiful Apartment',
      price: 1200,
      location: 'Downtown',
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 1
    }
  });
});

// POST /api/properties
router.post('/', (req, res) => {
  // TODO: Implement property creation
  res.json({
    success: true,
    message: 'Property created successfully',
    property: req.body
  });
});

module.exports = router;
