# Fail if the store zip is missing a root manifest.json, still has the unpacked
# `key` field, uses backslash zip entry names, or is missing a manifest icon/js/css/html path.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$zip = Join-Path $root 'dist\tweakers-hide-users.zip'

if (-not (Test-Path $zip)) {
    throw "Package check failed: missing $zip"
}

function Get-ManifestAssetPaths {
    param($Node)
    $paths = New-Object System.Collections.Generic.List[string]
    function Walk($value) {
        if ($null -eq $value) { return }
        if ($value -is [string]) {
            if ($value -notmatch '^[a-zA-Z][a-zA-Z0-9+.-]*:' -and $value -match '\.(js|css|html|htm|png|svg|ico)$') {
                $paths.Add(($value -replace '\\', '/').TrimStart('/'))
            }
            return
        }
        if ($value -is [System.Management.Automation.PSCustomObject]) {
            foreach ($p in $value.PSObject.Properties) { Walk $p.Value }
            return
        }
        if ($value -is [System.Collections.IEnumerable]) {
            foreach ($item in $value) { Walk $item }
        }
    }
    Walk $Node
    return @($paths | Select-Object -Unique)
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zip)
try {
    $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
    $backslash = @($entryNames | Where-Object { $_.IndexOf([char]'\') -ge 0 })
    if ($backslash.Count -gt 0) {
        throw "Package check failed: zip entry names must use forward slashes, found backslash in: $($backslash -join ', ')"
    }

    $manifestEntry = $archive.Entries | Where-Object { $_.FullName -eq 'manifest.json' } | Select-Object -First 1
    if (-not $manifestEntry) {
        $found = $entryNames -join ', '
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

$required = Get-ManifestAssetPaths $manifest
$entrySet = @{}
foreach ($n in $entryNames) { $entrySet[$n] = $true }
$missing = @($required | Where-Object { -not $entrySet.ContainsKey($_) })
if ($missing.Count -gt 0) {
    throw "Package check failed: manifest path(s) missing from zip: $($missing -join ', '). Entries: $($entryNames -join ', ')"
}

Write-Host "Package check OK: $zip (root manifest.json, key stripped, forward-slash entries, manifest assets present)"
