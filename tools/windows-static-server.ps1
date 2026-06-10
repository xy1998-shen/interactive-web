param(
  [int]$Port,
  [string]$Root
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Web

$listener = [System.Net.HttpListener]::new()
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "PowerShell static server listening on $prefix"

function Get-ContentType([string]$Path) {
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".htm" { return "text/html; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".js" { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".png" { return "image/png" }
    ".jpg" { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".webp" { return "image/webp" }
    ".svg" { return "image/svg+xml" }
    ".woff2" { return "font/woff2" }
    ".mp3" { return "audio/mpeg" }
    default { return "application/octet-stream" }
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Web.HttpUtility]::UrlDecode($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = "index.html"
    }

    $relativePath = $requestPath -replace "/", [System.IO.Path]::DirectorySeparatorChar
    $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $relativePath))
    $rootPath = [System.IO.Path]::GetFullPath($Root)

    if (-not $fullPath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
      $context.Response.Close()
      continue
    }

    if ([System.IO.Directory]::Exists($fullPath)) {
      $fullPath = [System.IO.Path]::Combine($fullPath, "index.html")
    }

    if (-not [System.IO.File]::Exists($fullPath)) {
      $context.Response.StatusCode = 404
      $context.Response.Close()
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $context.Response.StatusCode = 200
    $context.Response.ContentType = Get-ContentType $fullPath
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
