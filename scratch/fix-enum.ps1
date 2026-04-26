$file = 'c:\Users\ADMIN\Krieta\backend\prisma\schema.prisma'
$content = Get-Content $file -Raw

$old = @"
enum LiveSessionStatus {
  SCHEDULED
  LIVE
  ENDED
  CANCELLED
}
"@

$new = @"
enum LiveStreamType {
  NORMAL
  CHAMA
  CONTEST_BATTLE
  PROOF_OF_TASK
  COMMERCE
}

enum LiveStreamStatus {
  SCHEDULED
  LIVE
  ENDED
  CANCELLED
}
"@

$content = $content.Replace($old, $new)
Set-Content $file -Value $content -NoNewline
Write-Host "Done"
