$content = Get-Content "prisma\schema.prisma" -Raw

# Replace all snake_case relation references with camelCase
$content = $content -replace '\bcontest_action_completions\[', 'ContestActionCompletion[' `
  -replace '\bcontest_actions\b', 'ContestAction' `
  -replace '\bcontest_submissions\b', 'ContestSubmission' `
  -replace '\bcontests\b', 'Contest' `
  -replace '\bcontest_judges\[', 'ContestJudge[' `
  -replace '\bcontest_participants\[', 'ContestParticipant[' `
  -replace '\bcontest_prize_distributions\[', 'ContestPrizeDistribution[' `
  -replace '\bcontest_votes\[', 'ContestVote[' `
  -replace '\bcontest_winners\[', 'ContestWinner[' `
  -replace '\bescrows\[', 'Escrow[' `
  -replace '\bjudge_invites\[', 'JudgeInvite[' `
  -replace '\bmilestones\[', 'Milestone[' `
  -replace '\bshorts\[', 'Short[' `
  -replace '\bteam_contest_registrations\[', 'TeamContestRegistration[' `
  -replace '\bteam_submissions\[', 'TeamSubmission[' `
  -replace '\bdaily_stats\[', 'DailyStat[' `
  -replace '\busers\b', 'User' `
  -replace '\blive_banned_viewers\[', 'LiveBannedViewer[' `
  -replace '\blive_streams\b', 'LiveStream' `
  -replace '\blive_battles\[', 'LiveBattle[' `
  -replace '\blive_co_hosts\[', 'LiveCoHost[' `
  -replace '\blive_messages\[', 'LiveMessage[' `
  -replace '\blive_pinned_products\[', 'LivePinnedProduct[' `
  -replace '\blive_tips\[', 'LiveTip[' `
  -replace '\blive_viewers\[', 'LiveViewer[' `
  -replace '\bmilestone_completions\?', 'MilestoneCompletion?' `
  -replace '\bpost_comments\[', 'PostComment[' `
  -replace '\bpost_likes\[', 'PostLike[' `
  -replace '\bposts\b', 'Post' `
  -replace '\bproducts\b', 'Product' `
  -replace '\brefresh_tokens\[', 'RefreshToken[' `
  -replace '\bshort_collections\b', 'ShortCollection' `
  -replace '\bshort_comments\[', 'ShortComment[' `
  -replace '\bshort_likes\[', 'ShortLike[' `
  -replace '\bsubscription_tiers\b', 'SubscriptionTier' `
  -replace '\bsubscriptions\[', 'Subscription[' `
  -replace '\bteam_chats\?', 'TeamChat?' `
  -replace '\bteam_invitations\[', 'TeamInvitation[' `
  -replace '\bteam_members\[', 'TeamMember[' `
  -replace '\bteam_submission_votes\[', 'TeamSubmissionVote[' `
  -replace '\bteams\b', 'Team' `
  -replace '\btransactions\[', 'Transaction[' `
  -replace '\bwallets\?', 'Wallet?' `
  -replace '\blive_session_products\[', 'LiveSessionProduct[' `
  -replace '\blive_sessions\b', 'LiveSession' `
  -replace '\badmires\[', 'Admire[' `
  -replace '\bbio_links\[', 'BioLink['

$content | Set-Content "prisma\schema.prisma" -NoNewline
Write-Host "Schema updated successfully!"
