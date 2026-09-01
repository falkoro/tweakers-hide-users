# Fail if the store zip is missing a root manifest.json or still has the unpacked `key` field.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$zip = Join-Path $root 'dist\tweakers-hide-users.zip'

if (-not (Test-Path $zip)) {
    throw "Package check failed: missing $zip"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zip)
try {
    $manifestEntry = $archive.Entries | Where-Object {
        ($_.FullName -replace '\\', '/') -eq 'manifest.json'
    } | Select-Object -First 1

    if (-not $manifestEntry) {
        $found = ($archive.Entries | ForEach-Object { $_.FullName }) -join ', '
        throw "Package check failed: manifest.json is not at the zip root. Entries: $found"
    }

    $stream = $manifestEntry.Open()
    try {
        $reader = New-Object System.IO.StreamReader($stream)
        try {
            $jsonText = $reader.ReadToEnd()
        } finally {
            $reader.Dispose()
        }
    } finally {
        $stream.Dispose()
    }
} finally {
    $archive.Dispose()
}

$manifest = $jsonText | ConvertFrom-Json
if ($manifest.PSObject.Properties['key']) {
    throw "Package check failed: unpacked key field is still present in zip manifest.json"
}

Write-Host "Package check OK: $zip (root manifest.json, key stripped)"
