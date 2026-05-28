$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"

$requiredFiles = @(
  "package.json",
  "requirements.txt",
  "vercel.json",
  ".vercelignore",
  "api/index.py",
  "src/lib/api.ts",
  "backend/requirements.txt",
  "backend/app/main.py",
  "backend/app/config.py",
  "backend/app/api/routes/scans.py"
)

foreach ($file in $requiredFiles) {
  $path = Join-Path $repoRoot $file
  if (-not (Test-Path $path)) {
    throw "Missing required file: $file"
  }
}

$vercelConfig = Get-Content (Join-Path $repoRoot "vercel.json") -Raw | ConvertFrom-Json
$apiRewrite = $vercelConfig.rewrites | Where-Object {
  $_.source -eq "/api/(.*)" -and $_.destination -eq "/api/index.py"
}

if (-not $apiRewrite) {
  throw "vercel.json must route /api/* to /api/index.py."
}

if (-not $vercelConfig.functions."api/index.py") {
  throw "vercel.json must configure the api/index.py Python function."
}

$entrypoint = Get-Content (Join-Path $repoRoot "api/index.py") -Raw
if ($entrypoint -notmatch 'backend' -or $entrypoint -notmatch 'from app\.main import app') {
  throw "api/index.py must import the FastAPI app from backend/app/main.py."
}

$apiClient = Get-Content (Join-Path $repoRoot "src/lib/api.ts") -Raw
if ($apiClient -notmatch '"/api"') {
  throw "src/lib/api.ts must default to the same-origin /api backend."
}

$backendConfig = Get-Content (Join-Path $backendRoot "app/config.py") -Raw
if ($backendConfig -notmatch 'SERVERLESS_MODE') {
  throw "backend/app/config.py must define SERVERLESS_MODE."
}

$scanRoutes = Get-Content (Join-Path $backendRoot "app/api/routes/scans.py") -Raw
if ($scanRoutes -notmatch 'settings\.SERVERLESS_MODE') {
  throw "Scan creation must run synchronously when SERVERLESS_MODE is true."
}

$vercelIgnore = Get-Content (Join-Path $repoRoot ".vercelignore") -Raw
if ($vercelIgnore -match '(?m)^backend/$') {
  throw ".vercelignore must not exclude the backend folder."
}

Write-Host "Vercel + Supabase deployment files look good."
Write-Host ""
Write-Host "Vercel project:"
Write-Host "  Root Directory: repository root"
Write-Host "  Frontend: Next.js"
Write-Host "  Backend: api/index.py -> backend/app/main.py"
Write-Host "  API healthcheck: https://YOUR-VERCEL-DOMAIN.vercel.app/api/health"
Write-Host "  NEXT_PUBLIC_API_URL: leave unset for same-origin /api"
