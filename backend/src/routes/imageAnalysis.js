const express = require('express');
const router = express.Router();
const imageAnalysisService = require('../services/imageAnalysis');

// Analyze a single property image
router.post('/analyze', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    console.log('🔍 Analyzing image:', imageUrl);
    const result = await imageAnalysisService.analyzePropertyImage(imageUrl);

    res.json(result);
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing image',
      error: error.message
    });
  }
});

// Analyze multiple property images
router.post('/analyze-batch', async (req, res) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of image URLs is required'
      });
    }

    console.log(`🔍 Batch analyzing ${imageUrls.length} images...`);
    const result = await imageAnalysisService.analyzeMultipleImages(imageUrls);

    res.json(result);
  } catch (error) {
    console.error('❌ Batch analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing images',
      error: error.message
    });
  }
});

// Get analysis for a property (analyze all images)
router.post('/analyze-property', async (req, res) => {
  try {
    const { propertyId, images } = req.body;

    if (!propertyId || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Property ID and images are required'
      });
    }

    console.log(`🏠 Analyzing property ${propertyId} with ${images.length} images...`);
    
    // Analyze all property images
    const batchResult = await imageAnalysisService.analyzeMultipleImages(images);

    // Get the best analysis (highest quality score)
    const bestAnalysis = batchResult.individualAnalyses
      .filter(r => r.success)
      .map(r => r.analysis)
      .sort((a, b) => b.qualityScore - a.qualityScore)[0];

    res.json({
      success: true,
      propertyId: propertyId,
      overallQualityScore: batchResult.aggregateScore,
      totalImages: batchResult.totalImages,
      bestImageAnalysis: bestAnalysis,
      allAnalyses: batchResult.individualAnalyses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Property analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing property',
      error: error.message
    });
  }
});

module.exports = router;
