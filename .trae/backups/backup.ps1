$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = ".trae/backups"
$backupName = "backup-$timestamp.zip"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$includePaths = @(
    "src",
    "assets",
    "lib",
    "index.html",
    "package.json",
    "README.md",
    "vite.config.js",
    ".gitignore"
)

$excludePaths = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    ".trae/backups",
    ".trae/test-data"
)

Write-Host "Creating backup... ($backupName)"
Write-Host ""
Write-Host "Included files:"
$includePaths | ForEach-Object { Write-Host "  - $_" }

Write-Host ""
Write-Host "Excluded directories:"
$excludePaths | ForEach-Object { Write-Host "  - $_" }

try {
    Compress-Archive -Path $includePaths -DestinationPath "$backupDir/$backupName" -Force
    $backupSize = (Get-Item "$backupDir/$backupName").Length / 1KB
    Write-Host ""
    Write-Host "Backup successful!"
    Write-Host "Backup file: $backupDir/$backupName"
    Write-Host "File size: $($backupSize.ToString('N2')) KB"
    Write-Host ""
    Write-Host "Backup list:"
    Get-ChildItem -Path $backupDir | Sort-Object LastWriteTime -Descending | Format-Table Name, Length, LastWriteTime
} catch {
    Write-Host ""
    Write-Host "Backup failed: $_"
    exit 1
}