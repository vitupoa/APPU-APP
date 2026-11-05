# Runinga App Comprehensive Fixes & Enhancements

## Phase 1: Video Lifecycle & UI Fixes
- [ ] Update `VideoPlayer` component to use Compose Lifecycle observers so that video stops and resets when the app goes to the background.
- [ ] Add `FLAG_KEEP_SCREEN_ON` to the video player (Android/iOS) to ensure the screen stays on during playback.
- [ ] Fix Comments input so the keyboard does not cover the text area (using `WindowInsets.ime`).

## Phase 2: Navigation & Component Updates
- [ ] **Contest Creation Wizard**: Fix the "Continue" button in `CreateContestScreen` so it properly navigates to the next or previous step.
- [ ] **Parent Contests Screen**: Remove the bottom-right `+FAB` and add a "Create" button to the top-right of the top bar.
- [ ] **Profile Menu**: Add "Log Out" and "Wipe Local Cache" options to the 3-dot menu. Logging out will clear the token and navigate to login.

## Phase 3: Financial & Tip Dialog Updates
- [ ] **Backend Currency Rate**: Update `exchange.service.ts` so `Rc 1 = $100`. The backend will calculate fiat and send formatted strings to the frontend.
- [ ] **Tip Dialog**: Update default Rc values to `500, 1000, 2000, 5000`. 
- [ ] **Tip Dialog Insufficient Balance**: Implement "Top Up / Recharge" navigation button when balance is low. Ensure the send tip button functions properly.

## Phase 4: Feed Logic Updates
- [ ] **Admiring Tab**: Filter backend query to strictly include shorts from users the current user loves/admires.
- [ ] **Discover Tab**: Filter backend query to exclude shorts from people the current user already loves/admires.
