# Rently - Upload to New Branch Script
# Use this to upload your updated code to a new branch in existing repo

Write-Host "🚀 Rently - Upload to New Branch" -ForegroundColor Cyan
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
Write-Host "📝 This script will:" -ForegroundColor Yellow
Write-Host "   1. Initialize git if needed" -ForegroundColor Yellow
Write-Host "   2. Connect to your existing repository" -ForegroundColor Yellow
Write-Host "   3. Create a new branch with your updates" -ForegroundColor Yellow
Write-Host "   4. Push the new branch to GitHub" -ForegroundColor Yellow
Write-Host ""

$repoUrl = Read-Host "Enter your existing GitHub repository URL (e.g., https://github.com/username/repo-name.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ Repository URL is required" -ForegroundColor Red
    exit
}

Write-Host ""
$branchName = Read-Host "Enter the new branch name (e.g., ai-features, enhanced-version, v2.0)"

if ([string]::IsNullOrWhiteSpace($branchName)) {
    Write-Host "❌ Branch name is required" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Setting up Git repository..." -ForegroundColor Cyan

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing new Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
    
    # Check if there are existing remotes
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "⚠️  Existing remote found: $existingRemote" -ForegroundColor Yellow
        $replace = Read-Host "Replace with new remote? (y/n)"
        if ($replace -eq "y") {
            git remote remove origin
            Write-Host "✅ Old remote removed" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "🔗 Adding remote repository..." -ForegroundColor Cyan
git remote add origin $repoUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    # Remote already exists, update it
    git remote set-url origin $repoUrl
}
Write-Host "✅ Remote repository configured" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Adding all files to Git..." -ForegroundColor Cyan
git add .
Write-Host "✅ Files staged" -ForegroundColor Green

Write-Host ""
Write-Host "💾 Creating commit..." -ForegroundColor Cyan
git commit -m "Enhanced Rently Platform - AI Features & Improvements

🤖 AI Features:
- AI-powered image analysis with quality scoring (0-100)
- Feature detection (appliances, finishes, amenities)
- Room condition analysis
- Cleanliness, lighting, and maintenance scoring

📊 Enhanced Offer Evaluation (v2.0):
- Analyzes 15+ parameters
- Location quality scoring
- Building age and condition assessment
- Market comparison with real-time data
- Comprehensive recommendations and action items

🗺️ Interactive Maps:
- Real Leaflet maps with OpenStreetMap tiles
- Color-coded rent price markers
- Interactive popups and province filtering
- Drag, zoom, and explore functionality

🏠 Property Management:
- Save/unsave properties with localStorage persistence
- Contact landlord with inbox integration
- Advanced filtering and search

💬 Communication:
- Messages inbox with conversation threading
- Message persistence across sessions

✨ UI/UX Improvements:
- Professional gradients and animations
- Responsive design
- Modern component architecture
- Enhanced navigation"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No changes to commit or commit failed" -ForegroundColor Yellow
    Write-Host "Continuing with existing commits..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌿 Creating and switching to new branch: $branchName" -ForegroundColor Cyan
git checkout -b $branchName
Write-Host "✅ Branch created and checked out" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin $branchName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully uploaded to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your enhanced Rently platform is now on GitHub!" -ForegroundColor Cyan
    Write-Host "📍 Repository: $repoUrl" -ForegroundColor Cyan
    Write-Host "🌿 Branch: $branchName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Visit your repository on GitHub" -ForegroundColor Yellow
    Write-Host "2. You'll see a prompt to create a Pull Request" -ForegroundColor Yellow
    Write-Host "3. Review the changes in the PR" -ForegroundColor Yellow
    Write-Host "4. Merge the branch when ready" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 Direct link to create PR:" -ForegroundColor Cyan
    $repoPath = $repoUrl -replace '\.git$', '' -replace 'https://github.com/', ''
    Write-Host "   https://github.com/$repoPath/compare/$branchName" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Common issues:" -ForegroundColor Red
    Write-Host "   1. Authentication required - you may need to enter credentials" -ForegroundColor Yellow
    Write-Host "   2. Repository doesn't exist or URL is incorrect" -ForegroundColor Yellow
    Write-Host "   3. No permission to push to this repository" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try running: git push -u origin $branchName" -ForegroundColor Yellow
}
