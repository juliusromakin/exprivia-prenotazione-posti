# ==============================================================================
# Script di creazione pacchetto di deploy per exprivia-prenotazione-posti
# ==============================================================================

$baseName = "prenotazioniExpRM"
$sourcePath = Get-Location

# Cerca tutti i file ZIP esistenti che corrispondono al pattern
$existingZips = Get-ChildItem -Path $sourcePath -Filter "${baseName}_v*.zip" | Select-Object -ExpandProperty Name

$nextVersion = 1
if ($existingZips) {
    $versions = @()
    foreach ($zip in $existingZips) {
        if ($zip -match "${baseName}_v(\d+)\.zip") {
            $versions += [int]$Matches[1]
        }
    }
    if ($versions.Count -gt 0) {
        $nextVersion = ($versions | Measure-Object -Maximum).Maximum + 1
    }
}

# Formatta il nome della versione (es. v01, v02, v03...)
$versionStr = "v{0:D2}" -f [int]$nextVersion
$zipName = "${baseName}_${versionStr}.zip"
$zipPath = Join-Path $sourcePath $zipName

$folderName = "${baseName}_${versionStr}"
$tempDir = Join-Path $sourcePath "temp_deploy_staging"
$stagingProjectDir = Join-Path $tempDir $folderName

# Pulisci cartella temporanea se esiste
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}

# Crea la cartella temporanea e la sottocartella del progetto con il nome della versione
New-Item -ItemType Directory -Path $stagingProjectDir | Out-Null

# Copia i file escludendo le cartelle pesanti e altri pacchetti ZIP precedentemente generati
# Robocopy è uno strumento integrato in Windows molto veloce ed efficiente
robocopy "$sourcePath" "$stagingProjectDir" /E /XD .git node_modules target .angular .vscode .idea temp_deploy_staging /XF *.zip build.log package-lock.json create-deploy-package.ps1 | Out-Null

# Comprimi il contenuto creando lo ZIP con la cartella principale inclusa
Compress-Archive -Path "$stagingProjectDir" -DestinationPath $zipPath -Force

# Rimuovi la cartella temporanea
Remove-Item $tempDir -Recurse -Force

Write-Host "--------------------------------------------------------" -ForegroundColor Green
Write-Host " Pacchetto di deploy creato con successo!" -ForegroundColor Green
Write-Host " File generato: $zipName" -ForegroundColor Green
Write-Host " (Contiene al suo interno la cartella: $folderName)" -ForegroundColor Green
Write-Host " Ora puoi caricare questo file ZIP tramite FileZilla." -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Green
