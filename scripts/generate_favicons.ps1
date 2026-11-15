Add-Type -AssemblyName System.Drawing

$workspace = "d:\Lenovo\Downloads\AI-Powered Railway Crowd Management System"
$sourceLogo = Join-Path $workspace "public\images\indian-railways-logo.png"

if (-not (Test-Path $sourceLogo)) {
    Write-Error "Source logo not found at $sourceLogo"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourceLogo)
Write-Host "Source image size: $($img.Width) x $($img.Height)"

function Generate-PNG([int]$size, [string]$relativeDest) {
    $dest = Join-Path $workspace $relativeDest
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $size, $size)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $dest ($size x $size)"
}

Generate-PNG 16 "public\favicon-16x16.png"
Generate-PNG 32 "public\favicon-32x32.png"
Generate-PNG 32 "public\favicon.png"
Generate-PNG 48 "public\favicon-48x48.png"
Generate-PNG 180 "public\apple-touch-icon.png"
Generate-PNG 192 "public\android-chrome-192x192.png"

# Also write 32x32 to public\favicon.ico
Generate-PNG 32 "public\favicon.ico"

# Read 32x32 base64
$bytes = [System.IO.File]::ReadAllBytes((Join-Path $workspace "public\favicon-32x32.png"))
$b64 = [System.Convert]::ToBase64String($bytes)
[System.IO.File]::WriteAllText((Join-Path $workspace "public\favicon_b64.txt"), $b64)

$img.Dispose()
Write-Host "DONE: All favicons regenerated from authentic Indian Railways logo!"
