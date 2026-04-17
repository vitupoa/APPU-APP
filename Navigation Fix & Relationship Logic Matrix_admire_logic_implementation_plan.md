# Navigation Fix & Relationship Logic Matrix

## Background
Currently, attempting to open a searched user's profile from the Explore Tab invokes a crash due to `TabNavigator` implicitly catching the `.push()` invocation rather than a stack-based Navigator. Additionally, the Profile UI needs to implement a robust state machine for follow relationships to differentiate one-way follows ("Admiring", "Love") and mutual relationships ("Lovers" -> "Unlove").

## User Review Required
> [!IMPORTANT]
> - Root Navigator Fix: I will push searched profiles mapping directly to the application's Root Navigator (`navigator.parent?.parent`). This effectively hides the bottom bar while viewing searched profiles, providing a clean focus mechanism and guaranteeing that returning to the Explore Tab returns directly to the search screen!
> - Please approve the relationship button state descriptions applied to the users!

## Proposed Changes

---

### Navigation Engine
#### [MODIFY] [Tabs.kt](file:///c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/com/core/navigation/Tabs.kt)
- Update `navigator.parent ?: navigator` to dynamically seek the absolute Root Navigator via `navigator.parent?.parent ?: navigator`.
- This ensures the pushed profile bypasses the `TabNavigator` restrictions, successfully avoiding `UnsupportedOperationException`. 

---

### Profile Relationship State Machine (Mathematical Logic)
#### [MODIFY] [ProfileViewModel.kt](file:///c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/profile/presentation/viewmodel/ProfileViewModel.kt)
- Update `toggleAdmire()` to transition accurately through the defined states:
  - If `NONE` + toggle -> `ADMIRING`
  - If `ADMIRED_BY` + toggle -> `LOVERS` (Both admire each other)
  - If `ADMIRING` + toggle -> `NONE`
  - If `LOVERS` + toggle -> `ADMIRED_BY` (I drop the relationship, but they still admire me).

#### [MODIFY] [ProfileScreen.kt](file:///c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/profile/presentation/screen/ProfileScreen.kt)
- Implement dynamic Relationship Action Button Logic mapping:
  - `RelationshipStatus.ADMIRING` -> **"Unadmire"** (I admire them)
  - `RelationshipStatus.ADMIRED_BY` -> **"Love"** (They admire me, I haven't loved back)
  - `RelationshipStatus.LOVERS` -> **"Unlove"** (We admire each other)
  - `RelationshipStatus.NONE` -> **"Admire"** (No relationship exists)
- Wire up the "Admirers" and "Admiring" stats click events to successfully push `SocialListScreen` into the Navigator parameterized by `userId` and `listType`.

---

## Open Questions
- By pushing the profile to the absolute root level (hiding the bottom navigation bar while viewing the profile), does this align with your clean-UI layout? (When they press back, it flawlessly drops them directly into the Explore Tab without interference).

## Verification Plan
### Automated Tests
- Build `composeApp:assembleDebug` organically without syntax blocks.

### Manual Verification
- Execute search in Explore Tab and click on a user without crashes.
- Navigate back out of a Profile screen, observing the immediate return to the Search UI.
- Verify relationship button rendering accurately translates (`Admire` <--> `Unadmire`, `Love` <--> `Unlove`).
