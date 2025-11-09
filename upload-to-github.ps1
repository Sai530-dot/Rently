# Rently GitHub Upload Script
# Run this script to upload your project to GitHub

Write-Host "🚀 Rently GitHub Upload Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    git --version | Out-Null
    Write-Host "✅ Git is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first: https://git-scm.com/download/win" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📝 Before running this script, make sure you have:" -ForegroundColor Yellow
Write-Host "   1. Created a new repository on GitHub (https://github.com/new)" -ForegroundColor Yellow
Write-Host "   2. Named it something like 'rently-platform' or 'rental-app'" -ForegroundColor Yellow
Write-Host "   3. DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Have you created a GitHub repository? (y/n)"
if ($continue -ne "y") {
    Write-Host "Please create a repository first, then run this script again." -ForegroundColor Yellow
    exit
}

Write-Host ""
$repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/rently-platform.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ Repository URL is required" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Initializing Git repository..." -ForegroundColor Cyan

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Adding files to Git..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "💾 Creating commit..." -ForegroundColor Cyan
git commit -m "Initial commit: Rently Platform with AI features

Features included:
- User authentication and profile setup
- Property browsing with advanced filters
- AI-powered image analysis and quality scoring
- Enhanced offer evaluation with 15+ parameters
- Interactive Leaflet maps with OpenStreetMap
- Roommate matching algorithm
- Save properties functionality
- Contact landlord with inbox integration
- Real-time rent market analysis
- Responsive modern UI design"

Write-Host ""
Write-Host "🌿 Creating main branch..." -ForegroundColor Cyan
git branch -M main

Write-Host ""
Write-Host "🔗 Adding remote repository..." -ForegroundColor Cyan
git remote add origin $repoUrl

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host ""
Write-Host "✅ Successfully uploaded to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your Rently platform is now on GitHub!" -ForegroundColor Cyan
Write-Host "📍 Repository: $repoUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit your repository on GitHub" -ForegroundColor Yellow
Write-Host "2. Add a README.md with setup instructions" -ForegroundColor Yellow
Write-Host "3. Add collaborators if needed" -ForegroundColor Yellow
Write-Host "4. Set up GitHub Actions for CI/CD (optional)" -ForegroundColor Yellow
