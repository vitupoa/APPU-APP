import re
from pathlib import Path

root = Path(r"c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin")

# Files with errors
error_files = [
    "com/krieta/com/core/ui/components/ContentPaywall.kt",
    "com/krieta/com/core/ui/components/EmptyState.kt",
    "com/krieta/feature/analytics/presentation/screen/AnalyticsScreen.kt",
    "com/krieta/feature/calls/presentation/screen/ActiveCallScreen.kt",
    "com/krieta/feature/chama/presentation/ChamaListScreen.kt",
    "com/krieta/feature/chama/presentation/contribute/ChamaContributeScreen.kt",
    "com/krieta/feature/chama/presentation/dashboard/ChamaDashboardScreen.kt",
    "com/krieta/feature/chama/presentation/defaulters/DefaultersListScreen.kt",
    "com/krieta/feature/chama/presentation/payout/ChamaPayoutScreen.kt",
    "com/krieta/feature/chama/presentation/settings/ChamaSettingsScreen.kt",
    "com/krieta/feature/chama/presentation/wizard/CreateChamaScreen.kt",
    "com/krieta/feature/comments/presentation/screen/CommentsScreen.kt",
    "com/krieta/feature/contests/presentation/screen/ContestSubmissionFeedScreen.kt",
    "com/krieta/feature/contests/presentation/screen/CreateContestScreen.kt",
    "com/krieta/feature/contests/presentation/screen/JudgeInvitationsScreen.kt",
    "com/krieta/feature/contests/presentation/screen/SubmitContestScreen.kt",
    "com/krieta/feature/contests/presentation/screen/wizard/Step1DetailsAndDates.kt",
    "com/krieta/feature/contests/presentation/screen/wizard/Step3TasksAndConnectors.kt",
    "com/krieta/feature/contests/presentation/screen/wizard/Step5ReviewAndJudges.kt",
    "com/krieta/feature/live/presentation/screen/HostLiveScreen.kt",
    "com/krieta/feature/live/presentation/screen/ViewerLiveScreen.kt",
    "com/krieta/feature/marketplace/presentation/screen/InfluencerSearchScreen.kt",
    "com/krieta/feature/marketplace/presentation/screen/MarketplaceHomeScreen.kt",
    "com/krieta/feature/marketplace/presentation/screen/SocialMediaComponents.kt",
    "com/krieta/feature/marketplace/presentation/screen/SocialMediaManagementScreen.kt",
    "com/krieta/feature/marketplace/presentation/screen/SponsorAndGamificationScreens.kt",
    "com/krieta/feature/profile/presentation/screen/MilestonesScreen.kt",
    "com/krieta/feature/shop/presentation/screen/CreateListingScreen.kt",
    "com/krieta/feature/shorts/presentation/screen/ShortsScreen.kt",
    "com/krieta/feature/sponsored/presentation/screen/BrandDashboardScreen.kt",
    "com/krieta/feature/wallet/presentation/screen/WalletScreen.kt",
]

for file_rel in error_files:
    file_path = root / file_rel
    if not file_path.exists():
        print(f"SKIP: {file_rel} (not found)")
        continue
    
    print(f"Fixing: {file_rel}")
    content = file_path.read_text(encoding='utf-8')
    original = content
    
    # Fix: imageVector = painterResource(...) -> painter = painterResource(...)
    content = re.sub(r'imageVector\s*=\s*painterResource\(', 'painter = painterResource(', content)
    
    # Fix: Icon(imageVector = painterResource(...)) -> Icon(painter = painterResource(...))
    content = re.sub(r'Icon\s*\(\s*imageVector\s*=\s*painterResource\(', 'Icon(painter = painterResource(', content)
    
    # Fix remaining Icons.Default/Filled/AutoMirrored references
    content = re.sub(r'Icons\.Default\.(\w+)', r'painterResource(Res.drawable.ic_\1)', content, flags=re.IGNORECASE)
    content = re.sub(r'Icons\.Filled\.(\w+)', r'painterResource(Res.drawable.ic_\1)', content, flags=re.IGNORECASE)
    content = re.sub(r'Icons\.AutoMirrored\.Filled\.(\w+)', r'painterResource(Res.drawable.ic_\1)', content, flags=re.IGNORECASE)
    
    # Convert icon names to snake_case
    def to_snake_case(match):
        name = match.group(1)
        # Convert CamelCase to snake_case
        snake = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
        return f'painterResource(Res.drawable.ic_{snake})'
    
    content = re.sub(r'painterResource\(Res\.drawable\.ic_([A-Z][a-zA-Z0-9]+)\)', to_snake_case, content)
    
    # Fix specific known icon names
    replacements = {
        'ic_addphotoalternate': 'ic_add_photo',
        'ic_modecomment': 'ic_comment',
        'ic_favoriteborder': 'ic_favorite_border',
        'ic_shoppingbag': 'ic_shopping_bag',
        'ic_photocamera': 'ic_photo_camera',
        'ic_personadd': 'ic_person_add',
        'ic_callend': 'ic_call_end',
        'ic_micoff': 'ic_mic_off',
        'ic_videocamoff': 'ic_videocam_off',
        'ic_lockopen': 'ic_lock_open',
        'ic_checkcircle': 'ic_check_circle',
        'ic_arrowupward': 'ic_arrow_upward',
        'ic_arrowdownward': 'ic_arrow_downward',
        'ic_visibilityoff': 'ic_visibility_off',
        'ic_playarrow': 'ic_play_arrow',
        'ic_trendingup': 'ic_trending_up',
        'ic_morevert': 'ic_more_vert',
        'ic_expandmore': 'ic_expand_more',
        'ic_expandless': 'ic_expand_less',
        'ic_chevronright': 'ic_chevron_right',
        'ic_arrowback': 'ic_arrow_back',
    }
    
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    # Ensure imports are present
    if 'painterResource' in content and 'import org.jetbrains.compose.resources.painterResource' not in content:
        # Find package line
        package_match = re.search(r'^package .+$', content, re.MULTILINE)
        if package_match:
            insert_pos = content.find('\n', package_match.end()) + 1
            imports = "\nimport org.jetbrains.compose.resources.painterResource\nimport krieta.composeapp.generated.resources.Res\nimport krieta.composeapp.generated.resources.*\n"
            content = content[:insert_pos] + imports + content[insert_pos:]
    
    if content != original:
        file_path.write_text(content, encoding='utf-8')
        print(f"  [FIXED]")
    else:
        print(f"  [NO CHANGE]")

print("\n[DONE] All files processed")
