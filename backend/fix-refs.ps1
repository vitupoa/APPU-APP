$content = Get-Content "prisma\schema.prisma" -Raw

# Fix specific remaining issues
$content = $content -replace 'milestones   milestones @relation', 'milestones   Milestone  @relation'
$content = $content -replace 'shorts     shorts   @relation', 'shorts     Short    @relation'
$content = $content -replace 'team_submissions team_submissions @relation', 'team_submissions TeamSubmission @relation'
$content = $content -replace 'comment_likes\[\]', 'CommentLike[]'
$content = $content -replace 'comment_reports\[\]', 'CommentReport[]'
$content = $content -replace 'comments\[\]', 'Comment[]'
$content = $content -replace 'milestone_completions\[\]', 'MilestoneCompletion[]'

$content | Set-Content "prisma\schema.prisma" -NoNewline
Write-Host "Fixed remaining references!"
