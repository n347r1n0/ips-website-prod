param(
  [string]$Base = "main",
  [switch]$Force,         # принудительное удаление (-D)
  [switch]$IncludeGone,   # учитывать ветки с [gone] (типичный post-squash кейс)
  [switch]$DryRun,        # показать сводку, ничего не удалять (человеческий вид)
  [switch]$Json,          # вывести сводку в JSON (для машинного потребления)
  [string[]]$Keep = @(),  # шаблоны веток, которые нельзя трогать (glob), напр.: wip/*, chore/ci-*
  [switch]$NoSwitch       # не переключаться на $Base (если уже на нём)
)

$ErrorActionPreference = "Stop"

function Assert-GitRepo {
  try {
    $inside = git rev-parse --is-inside-work-tree 2>$null
    if (-not $inside -or $inside.Trim() -ne "true") { throw "Not a git repository." }
  } catch {
    Write-Host "❌ Run inside a git repository." -ForegroundColor Red
    exit 10
  }
}

function Get-AheadCount([string]$branch, [string]$base) {
  $count = git rev-list --count "$base..$branch" 2>$null
  if ([string]::IsNullOrWhiteSpace($count)) { return 0 }
  return [int]$count
}

function Matches-Keep([string]$branch, [string[]]$patterns) {
  foreach ($pat in $patterns) {
    if ($branch -like $pat) { return $true }
  }
  return $false
}

# --- 0) Предохранители и синхронизация --------------------------------------

Assert-GitRepo

# Текущая "ветка" (может быть HEAD при detached)
$current = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()

if (-not $NoSwitch) {
  # Перейти на базовую ветку и подтянуть её (без мерджа)
  git switch $Base | Out-Null
  git pull --ff-only origin $Base | Out-Null
}

# Обновить ремоуты и подчистить удалённые tracking-ветки
git fetch --prune | Out-Null

# Обновить $current после возможного switch
$current = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()

# --- 1) Сбор кандидатов ------------------------------------------------------

# Явно слитые относительно $Base (полная история)
$merged = @(git branch --merged $Base 2>$null | ForEach-Object { $_.Trim() }) `
  | Where-Object { $_ -ne "" -and $_ -notmatch '^\*' }

# Ветки с удалённым upstream ([gone]) — устойчиво к squash-merge
$gone = @()
if ($IncludeGone) {
  $gone = git for-each-ref --format="%(refname:short) %(upstream:track)" refs/heads `
    | Where-Object { $_ -match '\[gone\]' } `
    | ForEach-Object { ($_ -split '\s+')[0] }
}

# Защищённые ветки
$protected = @($Base, 'dev', 'develop', $current) | Sort-Object -Unique

# Кандидаты = (merged ∪ gone) − protected − keep
$candidates = @($merged + $gone | Sort-Object -Unique) `
  | Where-Object {
      $b = $_
      ($protected -notcontains $b) -and -not (Matches-Keep $b $Keep)
    }

if (-not $candidates -or $candidates.Count -eq 0) {
  if ($Json) {
    $out = [pscustomobject]@{
      safe      = @()
      needForce = @()
      message   = "Nothing to delete."
    } | ConvertTo-Json -Depth 4
    Write-Output $out
  } else {
    Write-Host "Nothing to delete. ✅"
  }
  exit 0
}

# --- 2) Классификация --------------------------------------------------------

$safe      = @()
$needForce = @()

foreach ($b in $candidates) {
  $isMerged = $merged -contains $b
  $isGone   = $gone   -contains $b
  $ahead    = Get-AheadCount -branch $b -base $Base

  if ( ($isMerged -and $ahead -eq 0) -or ($isGone -and $ahead -eq 0) ) {
    $safe += [pscustomobject]@{
      Branch = $b; Reason = $(if ($isMerged) { "merged" } else { "gone" }); Ahead = $ahead
    }
  } else {
    $needForce += [pscustomobject]@{
      Branch = $b; Reason = $(if ($isGone) { "gone+ahead" } elseif ($isMerged) { "merged+ahead?" } else { "unmerged" }); Ahead = $ahead
    }
  }
}

# --- 3) Вывод сводки ---------------------------------------------------------

if ($Json) {
  $out = [pscustomobject]@{
    safe      = $safe
    needForce = $needForce
    base      = $Base
    current   = $current
    keep      = $Keep
  } | ConvertTo-Json -Depth 6
  Write-Output $out
} else {
  if ($safe.Count -gt 0) {
    Write-Host "Safe to delete (-d):" -ForegroundColor Cyan
    foreach ($row in $safe) { Write-Host ("  {0}  ({1}, ahead={2})" -f $row.Branch,$row.Reason,$row.Ahead) }
  }
  if ($needForce.Count -gt 0) {
    Write-Host "`nRequire -Force (-D):" -ForegroundColor Yellow
    foreach ($row in $needForce) { Write-Host ("  {0}  ({1}, ahead={2})" -f $row.Branch,$row.Reason,$row.Ahead) }
  }
}

if ($DryRun) {
  if (-not $Json) { Write-Host "`nDry-run only. No changes applied." -ForegroundColor Yellow }
  exit 0
}

# --- 4) Удаление -------------------------------------------------------------

$deletedCount = 0

foreach ($row in $safe) {
  git branch -d $row.Branch | Out-Null
  $deletedCount++
}

if ($needForce.Count -gt 0) {
  if (-not $Force) {
    if (-not $Json) {
      Write-Host "`nSome branches require -Force. Re-run with:" -ForegroundColor Yellow
      Write-Host "  git gclean -Force" -ForegroundColor Yellow
    }
    # код выхода 1 — требует повторного запуска с -Force
    exit 1
  }
  foreach ($row in $needForce) {
    git branch -D $row.Branch | Out-Null
    $deletedCount++
  }
}

if (-not $Json) { Write-Host "✅ Local cleanup done. Removed: $deletedCount" }
# код выхода 2 — были удаления (для возможных CI-хуков)
exit ($(if ($deletedCount -gt 0) { 2 } else { 0 }))
