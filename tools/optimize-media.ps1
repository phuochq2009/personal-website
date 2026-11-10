# Run from anywhere:  powershell -ExecutionPolicy Bypass -File tools\optimize-media.ps1
# Needs ImageMagick and FFmpeg:  winget install ImageMagick.ImageMagick Gyan.FFmpeg   (then reopen PowerShell)
# Reads originals from images\  ->  writes small web copies to media\  ->  writes media.json
Set-Location (Split-Path -Parent $PSScriptRoot)
$srcRoot = (Resolve-Path 'images').Path
$imgExt = '.jpg','.jpeg','.png','.heic','.heif','.webp'
$vidExt = '.mp4','.mov','.m4v'
foreach ($f in Get-ChildItem $srcRoot -Recurse -File) {
  $ext = $f.Extension.ToLower()
  $isImg = $imgExt -contains $ext; $isVid = $vidExt -contains $ext
  if (-not ($isImg -or $isVid)) { continue }
  $rel = $f.FullName.Substring($srcRoot.Length + 1).ToLower()
  $dest = Join-Path 'media' ([IO.Path]::ChangeExtension($rel, $(if ($isImg) { '.jpg' } else { '.mp4' })))
  if (Test-Path $dest) { continue }
  New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
  Write-Host "Converting $rel"
  if ($isImg) { & magick $f.FullName -auto-orient -resize '1600x1600>' -strip -quality 80 $dest }
  else { & ffmpeg -y -loglevel error -i $f.FullName -vf "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'" -c:v libx264 -crf 28 -preset veryfast -c:a aac -b:a 96k -movflags +faststart $dest }
  if ($LASTEXITCODE -ne 0) { Write-Warning "FAILED: $rel"; Remove-Item $dest -ErrorAction SilentlyContinue }
}
function NatKey($s) { [regex]::Replace($s, '\d+', { param($m) $m.Value.PadLeft(8, '0') }) }
$media = [ordered]@{}
foreach ($d in Get-ChildItem 'media' -Directory | Sort-Object Name) {
  $root = $d.FullName
  $items = Get-ChildItem $root -Recurse -File | Where-Object { @('.jpg', '.mp4') -contains $_.Extension.ToLower() } | ForEach-Object {
    [pscustomobject]@{
      g = $_.DirectoryName.Substring($root.Length).Trim('\')
      n = $_.Name
      src = 'media/' + $d.Name + '/' + ($_.FullName.Substring($root.Length + 1) -replace '\\', '/')
      type = $(if ($_.Extension.ToLower() -eq '.mp4') { 'video' } else { 'image' })
    }
  } | Sort-Object g, { NatKey $_.n }
  $media[$d.Name] = @($items | ForEach-Object { [pscustomobject]@{ g = $_.g; src = $_.src; type = $_.type } })
}
$papers = [ordered]@{}
if (Test-Path 'papers') {
  foreach ($d in Get-ChildItem 'papers' -Directory | Sort-Object Name) {
    $papers[$d.Name] = @(Get-ChildItem $d.FullName -Filter *.pdf | ForEach-Object {
      [pscustomobject]@{ name = $_.BaseName; src = 'papers/' + $d.Name + '/' + [uri]::EscapeDataString($_.Name) } })
  }
}
$json = [ordered]@{ media = $media; papers = $papers } | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText((Join-Path (Get-Location) 'media.js'), ('window.MEDIA = ' + $json + ';'), (New-Object Text.UTF8Encoding $false))
Write-Host "Done. media.js written."