# Pack a Chrome Web Store zip. Strips the unpacked-extension `key` field.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'dist'
$stage = Join-Path $outDir 'stage'
$zip = Join-Path $outDir 'tweakers-hide-users.zip'

if (Test-Path $outDir) {
    Remove-Item $outDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stage | Out-Null

$files = @(
    'background.js',
    'boot.js',
    'thu-core.js',
    'content.js',
    'content.css',
    'popup.html',
    'popup.js',
    'popup.css',
    'PRIVACY.md',
    'README.md',
    'LICENSE'
)
foreach ($f in $files) {
    Copy-Item (Join-Path $root $f) (Join-Path $stage $f)
}

New-Item -ItemType Directory -Path (Join-Path $stage 'images') | Out-Null
Copy-Item (Join-Path $root 'images\icon-16.png') (Join-Path $stage 'images\icon-16.png')
Copy-Item (Join-Path $root 'images\icon-48.png') (Join-Path $stage 'images\icon-48.png')
Copy-Item (Join-Path $root 'images\icon-128.png') (Join-Path $stage 'images\icon-128.png')

$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.PSObject.Properties['key']) {
    $manifest.PSObject.Properties.Remove('key')
}
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $stage 'manifest.json') -Encoding utf8

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -Force
Write-Host "Wrote $zip"
