param(
  [string]$Base = "main",
  [switch]$Force
)

# 1) Переключаемся на базовую ветку и обновляем её
git switch $Base
git pull --ff-only origin $Base

# 2) Подчистить устаревшие remote-tracking ветки (достаточно этого)
git fetch --prune

# 3) Список веток, полностью слитых в $Base
$merged = git branch --merged $Base | ForEach-Object { $_.Trim() }

# убрать текущую (звёздочку) и защитить базовые ветки
$protected = @($Base, 'dev', 'develop')
$merged = $merged | Where-Object { $_ -notmatch '^\*' }
$toDelete = $merged | Where-Object { $protected -notcontains $_ }

if ($toDelete.Count -eq 0) {
  Write-Host "Nothing to delete. ✅"
  exit 0
}

Write-Host "Candidates to delete:" -ForegroundColor Cyan
$toDelete | ForEach-Object { Write-Host "  $_" }

# 4) Удаляем ветки (-d безопасно; -D при -Force)
foreach ($b in $toDelete) {
  if ($Force) {
    git branch -D $b
  } else {
    git branch -d $b
  }
}

Write-Host "✅ Local cleanup done."
