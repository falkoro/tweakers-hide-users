# Pack a Chrome Web Store zip. Strips the unpacked-extension `key` field.
# Nested zip entries use forward slashes (images/icon-16.png), never backslashes.
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

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$stageFull = (Resolve-Path -LiteralPath $stage).Path.TrimEnd('\', '/')
$archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in (Get-ChildItem -LiteralPath $stageFull -Recurse -File)) {
        $relative = $file.FullName.Substring($stageFull.Length).TrimStart('\', '/')
        $entryName = $relative.Replace('\', '/')
        if ($entryName.IndexOf([char]'\') -ge 0) {
            throw "Refusing to write zip entry with backslash path: $entryName"
        }
        [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive,
            $file.FullName,
            $entryName,
            [System.IO.Compression.CompressionLevel]::Optimal
        )
    }
} finally {
    $archive.Dispose()
}

Write-Host "Wrote $zip"
& (Join-Path $PSScriptRoot 'check-package.ps1')
