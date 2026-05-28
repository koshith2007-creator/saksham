$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"

$requiredFiles = @(
  "package.json",
  "src/lib/api.ts",
  "backend/Dockerfile",
  "backend/railway.json",
  "railway.json",
  "backend/requirements.txt",
  "backend/app/main.py"
)

foreach ($file in $requiredFiles) {
  $path = Join-Path $repoRoot $file
  if (-not (Test-Path $path)) {
    throw "Missing required file: $file"
  }
}

$dockerfile = Get-Content (Join-Path $backendRoot "Dockerfile") -Raw
if ($dockerfile -notmatch 'uvicorn app\.main:app') {
  throw "backend/Dockerfile does not start the FastAPI app with uvicorn."
}

if ($dockerfile -notmatch '\$\{PORT:-8000\}') {
  throw "backend/Dockerfile must bind to Railway's PORT with a local fallback."
}

$railwayConfig = Get-Content (Join-Path $backendRoot "railway.json") -Raw | ConvertFrom-Json
if ($railwayConfig.deploy.healthcheckPath -ne "/api/health") {
  throw "backend/railway.json healthcheckPath must be /api/health."
}

$rootRailwayConfig = Get-Content (Join-Path $repoRoot "railway.json") -Raw | ConvertFrom-Json
if ($rootRailwayConfig.build.builder -ne "DOCKERFILE") {
  throw "Root railway.json must force the Dockerfile builder."
}

if ($rootRailwayConfig.build.dockerfilePath -ne "Dockerfile") {
  throw "Root railway.json must point at the backend fallback Dockerfile."
}

if ($rootRailwayConfig.deploy.healthcheckPath -ne "/api/health") {
  throw "Root railway.json healthcheckPath must be /api/health."
}

$rootDockerfile = Get-Content (Join-Path $repoRoot "Dockerfile") -Raw
if ($rootDockerfile -notmatch 'COPY backend/requirements\.txt') {
  throw "Root Dockerfile must build the backend fallback, not the frontend."
}

if ($rootDockerfile -match 'nextjs|npm run build|node server\.js') {
  throw "Root Dockerfile still looks like a Next.js build."
}

Write-Host "Deployment files look good."
Write-Host ""
Write-Host "Railway backend service:"
Write-Host "  Root Directory: backend"
Write-Host "  Config File: /backend/railway.json"
Write-Host "  Custom Start Command: empty"
Write-Host "  Public URL healthcheck: https://saksham-production.up.railway.app/api/health"
Write-Host ""
Write-Host "Vercel frontend project:"
Write-Host "  Root Directory: repository root"
Write-Host "  NEXT_PUBLIC_API_URL: https://saksham-production.up.railway.app/api"
