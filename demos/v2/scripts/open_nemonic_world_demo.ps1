$ErrorActionPreference = "Stop"

$demoDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$url = "http://127.0.0.1:4173/"
$serverPattern = "vite preview -- --host 127.0.0.1 --port 4173"

function Test-DemoReady {
    try {
        $null = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
        return $true
    }
    catch {
        return $false
    }
}

function Find-PreviewProcess {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.CommandLine -and
            $_.CommandLine -like "*$serverPattern*" -and
            $_.CommandLine -like "*$demoDir*"
        } |
        Select-Object -First 1
}

if (-not (Test-DemoReady)) {
    $previewProcess = Find-PreviewProcess

    if (-not $previewProcess) {
        Start-Process `
            -FilePath "cmd.exe" `
            -WorkingDirectory $demoDir `
            -WindowStyle Minimized `
            -ArgumentList '/c', 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173'
    }

    for ($index = 0; $index -lt 30; $index++) {
        Start-Sleep -Seconds 1
        if (Test-DemoReady) {
            break
        }
    }
}

Start-Process $url
