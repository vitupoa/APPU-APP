# End-to-End Testing Guide for Contest Creation Wizard

## Overview

This guide provides comprehensive end-to-end testing scenarios for the Contest Creation Wizard. These tests verify the complete integration of all wizard components, navigation logic, validation, and backend submission.

## Prerequisites

- Krieta mobile app installed and running
- Backend API accessible
- Test user account with contest creation permissions
- Test data prepared for various scenarios

## Test Environment Setup

1. Ensure backend is running and accessible
2. Clear any existing test contest data
3. Verify user authentication is working
4. Check that Kr currency conversion is functioning

## Test Scenarios

### Test 1: Individual-Only Contest Creation (Happy Path)

**Objective:** Create a complete individual-only contest with all features

**Steps:**
1. Navigate to Create Contest screen
2. **Step 1: Contest Details**
   - Enter title: "Photography Challenge 2024" (valid: 3-80 chars)
   - Enter description: "Submit your best landscape photography" (valid: 10+ chars)
   - Enter rules: "Original photos only, no editing allowed"
   - Select start date: Tomorrow at 10:00 AM
   - Select end date: 7 days from start date
   - Verify duration shows "7 days" (valid: 2+ hours)
   - Click Continue

3. **Step 2: Audience & Fees**
   - Enable Demographics Lock
   - Set min age: 18
   - Set max age: 65
   - Enter target locations: "Kenya, Uganda, Tanzania"
   - Select participation type: "Individual Only"
   - Verify team fields are hidden
   - Enter entry fee: 100 (local currency)
   - Verify Kr conversion displays correctly
   - Click Continue

4. **Step 3: Tasks**
   - Select task type: "Follow Krieta"
   - Enter username: "@krietaofficial"
   - Click Add Task
   - Select task type: "Follow Instagram"
   - Enter username: "@krieta"
   - Click Add Task
   - Verify 2 tasks are listed
   - Click Continue

5. **Step 4: Prizes**
   - Select winner slots: 3
   - Enter 1st place prize: 5000
   - Enter 2nd place prize: 3000
   - Enter 3rd place prize: 2000
   - Verify total prize pool: 10000
   - Verify Kr conversions display correctly
   - Select selection method: "Manual"
   - Verify paid voting is disabled
   - Enable milestone airdrop
   - Enter airdrop amount: 50
   - Enter participant limit: 100
   - Click Continue

6. **Step 5: Review & Judges**
   - Verify judge assignment interface is visible (manual selection)
   - Search for judge: "testjudge"
   - Add judge to list
   - Verify judge appears in list
   - Review all settings in review cards:
     - Contest details correct
     - Dates and duration correct
     - Participation type: Individual Only
     - Demographics settings correct
     - Entry fee correct
     - Tasks listed correctly
     - Prize distribution correct
     - Selection method: Manual
     - Judge assigned
     - Milestone airdrop configured
   - Click Publish Contest

7. **Verification**
   - Verify loading indicator appears
   - Verify success message
   - Verify wizard closes
   - Verify contest appears in contest list
   - Verify backend received correct data

**Expected Result:** ✅ Contest created successfully with all configured settings

---

### Test 2: Team-Only Contest Creation

**Objective:** Create a team-only contest with team size requirements

**Steps:**
1. Navigate to Create Contest screen
2. **Step 1:** Enter valid contest details and dates
3. **Step 2:**
   - Disable Demographics Lock
   - Select participation type: "Team Only"
   - Verify team configuration fields appear
   - Enter team size: 5
   - Enter max teams: 20
   - Enter entry fee: 0 (free contest)
   - Click Continue
4. **Step 3:** Add at least one task
5. **Step 4:** Configure prizes with Random selection method
6. **Step 5:**
   - Verify judge assignment interface is hidden (random selection)
   - Review settings
   - Click Publish Contest
7. **Verification:**
   - Verify contest created with participationType: TEAM_ONLY
   - Verify teamSize: 5
   - Verify maxTeams: 20

**Expected Result:** ✅ Team-only contest created with correct team configuration

---

### Test 3: Hybrid Contest (Both Individual and Team)

**Objective:** Create a contest allowing both individual and team participation

**Steps:**
1. Navigate to Create Contest screen
2. **Step 1:** Enter valid contest details and dates
3. **Step 2:**
   - Select participation type: "Both"
   - Verify team configuration fields appear
   - Enter team size: 3
   - Leave max teams empty (optional)
   - Enter entry fee: 50
   - Click Continue
4. **Step 3:** Add tasks
5. **Step 4:** Configure prizes with Combination selection method
6. **Step 5:**
   - Verify judge assignment interface is visible (combination selection)
   - Add at least one judge
   - Review settings
   - Click Publish Contest
7. **Verification:**
   - Verify contest created with participationType: BOTH
   - Verify teamSize: 3
   - Verify maxTeams is null (not specified)

**Expected Result:** ✅ Hybrid contest created allowing both participation types

---

### Test 4: Validation Error Handling

**Objective:** Verify validation errors are properly displayed and prevent progression

**Test 4.1: Step 1 Validation**
1. Navigate to Create Contest screen
2. Leave title empty
3. Verify Continue button is disabled
4. Enter title: "AB" (too short)
5. Verify error message: "Title must be at least 3 characters"
6. Enter title: (81+ characters)
7. Verify error message: "Title must not exceed 80 characters"
8. Enter valid title
9. Leave description empty
10. Verify Continue button is disabled
11. Enter description: "Short" (< 10 chars)
12. Verify error message: "Description must be at least 10 characters"
13. Enter valid description
14. Select start date: Tomorrow
15. Select end date: 1 hour from start
16. Verify error message: "Contest duration must be at least 2 hours"
17. Select valid end date (2+ hours from start)
18. Verify Continue button is enabled

**Test 4.2: Step 2 Validation**
1. Enable Demographics Lock
2. Set min age: 30
3. Set max age: 20
4. Verify error message: "Minimum age must be less than or equal to maximum age"
5. Correct age range
6. Select participation type: "Team Only"
7. Enter team size: 1
8. Verify error message: "Team size must be between 2 and 10 members"
9. Enter team size: 11
10. Verify error message: "Team size must be between 2 and 10 members"
11. Enter valid team size: 5
12. Enter entry fee: -100
13. Verify error message: "Entry fee cannot be negative"
14. Enter valid entry fee: 100
15. Enable paid voting
16. Verify error message: "Entry fee and paid voting are mutually exclusive"
17. Disable paid voting
18. Verify Continue button is enabled

**Test 4.3: Step 3 Validation**
1. Navigate to Step 3
2. Verify Continue button is disabled (no tasks added)
3. Verify error message: "At least one task is required"
4. Add one task
5. Verify Continue button is enabled

**Test 4.4: Step 4 Validation**
1. Navigate to Step 4
2. Enter negative prize amount
3. Verify error message: "Prize amount cannot be negative"
4. Enter valid prize amounts
5. Enable milestone airdrop
6. Enter airdrop amount: 0
7. Verify error message: "Airdrop amount must be positive"
8. Enter airdrop amount: -50
9. Verify error message: "Airdrop amount must be positive"
10. Enter valid airdrop amount: 50
11. Enter airdrop limit: 0
12. Verify error message: "Airdrop participant limit must be positive"
13. Enter valid airdrop limit: 100
14. Verify Continue button is enabled

**Test 4.5: Step 5 Validation**
1. Navigate to Step 5 with Manual selection method
2. Verify Publish button is disabled (no judges)
3. Verify error message: "At least one judge is required"
4. Add one judge
5. Verify Publish button is enabled
6. Try to add 16th judge
7. Verify error message: "Maximum 15 judges allowed"

**Expected Result:** ✅ All validation errors properly displayed and prevent invalid submissions

---

### Test 5: Back Navigation and Data Persistence

**Objective:** Verify back navigation preserves entered data

**Steps:**
1. Navigate to Create Contest screen
2. **Step 1:** Enter all contest details
3. Click Continue to Step 2
4. **Step 2:** Configure audience and fees
5. Click Continue to Step 3
6. **Step 3:** Add tasks
7. Click Continue to Step 4
8. Click Back button
9. Verify returned to Step 3
10. Verify added tasks are still present
11. Click Back button
12. Verify returned to Step 2
13. Verify audience and fee settings are preserved
14. Click Back button
15. Verify returned to Step 1
16. Verify contest details are preserved
17. Click Back button
18. Verify wizard exits and returns to previous screen

**Expected Result:** ✅ All entered data is preserved when navigating back

---

### Test 6: Progress Indicator Visual States

**Objective:** Verify progress indicator correctly shows active/inactive states

**Steps:**
1. Navigate to Create Contest screen
2. **Step 1:**
   - Verify step 1 circle is yellow (#F5A623)
   - Verify step 1 label is yellow and bold
   - Verify steps 2-5 circles are gray (#3A3A3F)
   - Verify steps 2-5 labels are gray and normal weight
   - Verify no connecting lines are yellow
3. Click Continue to Step 2
4. **Step 2:**
   - Verify steps 1-2 circles are yellow
   - Verify steps 1-2 labels are yellow and bold
   - Verify steps 3-5 circles are gray
   - Verify connecting line between 1-2 is yellow
5. Continue to Step 3
6. **Step 3:**
   - Verify steps 1-3 are yellow
   - Verify connecting lines 1-2 and 2-3 are yellow
7. Continue to Step 4
8. **Step 4:**
   - Verify steps 1-4 are yellow
   - Verify connecting lines 1-2, 2-3, 3-4 are yellow
9. Continue to Step 5
10. **Step 5:**
    - Verify all 5 steps are yellow
    - Verify all connecting lines are yellow

**Expected Result:** ✅ Progress indicator correctly highlights active steps

---

### Test 7: Mutual Exclusivity Constraints

**Objective:** Verify entry fee and paid voting mutual exclusivity

**Test 7.1: Entry Fee First**
1. Navigate to Step 2
2. Enter entry fee: 100
3. Try to enable paid voting
4. Verify error message displayed
5. Verify paid voting cannot be enabled
6. Clear entry fee (set to 0)
7. Enable paid voting
8. Verify paid voting is enabled
9. Try to enter entry fee
10. Verify error message displayed

**Test 7.2: Paid Voting First**
1. Navigate to Step 2
2. Enable paid voting
3. Try to enter entry fee > 0
4. Verify error message displayed
5. Disable paid voting
6. Enter entry fee: 100
7. Verify entry fee is accepted

**Expected Result:** ✅ Entry fee and paid voting are mutually exclusive

---

### Test 8: Judge Assignment Based on Selection Method

**Objective:** Verify judge interface visibility based on selection method

**Steps:**
1. Navigate to Step 4
2. Select selection method: "Manual"
3. Continue to Step 5
4. Verify judge assignment interface is visible
5. Verify "At least one judge is required" message
6. Go back to Step 4
7. Select selection method: "Random"
8. Continue to Step 5
9. Verify judge assignment interface is hidden
10. Verify no judge requirement
11. Go back to Step 4
12. Select selection method: "Voting"
13. Continue to Step 5
14. Verify judge assignment interface is hidden
15. Go back to Step 4
16. Select selection method: "Combination"
17. Continue to Step 5
18. Verify judge assignment interface is visible

**Expected Result:** ✅ Judge interface visibility matches selection method requirements

---

### Test 9: Kr Currency Conversion Display

**Objective:** Verify real-time Kr conversion displays correctly

**Steps:**
1. Navigate to Step 2
2. Enter entry fee: 100
3. Verify Kr conversion displays (e.g., "Kr.X")
4. Change entry fee to 200
5. Verify Kr conversion updates in real-time
6. Navigate to Step 4
7. Enter 1st place prize: 5000
8. Verify Kr conversion displays for prize
9. Enter 2nd place prize: 3000
10. Verify Kr conversion displays for prize
11. Verify total prize pool Kr conversion displays
12. Enable milestone airdrop
13. Enter airdrop amount: 50
14. Verify Kr conversion displays for airdrop

**Expected Result:** ✅ All Kr conversions display correctly and update in real-time

---

### Test 10: Backend Integration and Error Handling

**Objective:** Verify backend submission and error handling

**Test 10.1: Successful Submission**
1. Complete all wizard steps with valid data
2. Click Publish Contest
3. Verify loading indicator appears
4. Verify Publish button is disabled during submission
5. Wait for backend response
6. Verify success state
7. Verify wizard closes
8. Verify contest appears in backend database

**Test 10.2: Backend Error Handling**
1. Disconnect from network or stop backend
2. Complete all wizard steps
3. Click Publish Contest
4. Verify loading indicator appears
5. Wait for error response
6. Verify error message displays
7. Verify wizard remains on Step 5
8. Verify user can correct and retry
9. Reconnect network
10. Click Publish Contest again
11. Verify successful submission

**Test 10.3: Validation Error from Backend**
1. Complete wizard with data that passes frontend validation but fails backend validation
2. Click Publish Contest
3. Verify backend error message displays
4. Verify wizard remains on Step 5
5. Correct the issue
6. Retry submission
7. Verify successful submission

**Expected Result:** ✅ Backend integration works correctly with proper error handling

---

### Test 11: Task Management

**Objective:** Verify task addition and removal functionality

**Steps:**
1. Navigate to Step 3
2. Select task type: "Follow Krieta"
3. Enter username: "@user1"
4. Click Add Task
5. Verify task appears in list
6. Select task type: "Subscribe YouTube"
7. Enter URL: "https://youtube.com/channel"
8. Click Add Task
9. Verify task appears in list
10. Verify 2 tasks total
11. Click remove on first task
12. Verify task is removed
13. Verify 1 task remains
14. Add 3 more tasks
15. Verify all tasks appear in list
16. Remove all tasks
17. Verify Continue button is disabled
18. Verify error message: "At least one task is required"

**Expected Result:** ✅ Task addition and removal works correctly

---

### Test 12: Review Card Completeness

**Objective:** Verify all configured settings appear in review cards

**Steps:**
1. Complete all wizard steps with all optional features enabled:
   - Demographics lock
   - Team configuration
   - Entry fee
   - Multiple tasks
   - Multiple prizes
   - Milestone airdrop
   - Judge assignment
2. Navigate to Step 5
3. Verify review cards display:
   - ✅ Contest title, description, rules
   - ✅ Start date, end date, duration
   - ✅ Participation type
   - ✅ Team size and max teams (if applicable)
   - ✅ Demographics settings (if enabled)
   - ✅ Entry fee or paid voting status
   - ✅ All added tasks with types
   - ✅ Prize distribution for all winners
   - ✅ Total prize pool
   - ✅ Selection method
   - ✅ Assigned judges (if applicable)
   - ✅ Milestone airdrop settings (if enabled)

**Expected Result:** ✅ All configured settings appear in review cards

---

## Performance Testing

### Test 13: Large Data Handling

**Objective:** Verify wizard handles large amounts of data

**Steps:**
1. Add maximum number of tasks (test with 10+ tasks)
2. Add maximum number of judges (15 judges)
3. Enter very long description (test with 1000+ characters)
4. Verify UI remains responsive
5. Verify scrolling works smoothly
6. Verify all data is submitted correctly

**Expected Result:** ✅ Wizard handles large data sets without performance issues

---

## Accessibility Testing

### Test 14: Keyboard Navigation

**Objective:** Verify keyboard navigation works correctly

**Steps:**
1. Navigate through all input fields using Tab key
2. Verify focus indicators are visible (yellow border)
3. Verify all buttons are reachable via keyboard
4. Verify Enter key submits forms where appropriate
5. Verify Escape key cancels dialogs

**Expected Result:** ✅ Full keyboard navigation support

---

### Test 15: Screen Reader Compatibility

**Objective:** Verify screen reader announces content correctly

**Steps:**
1. Enable screen reader (TalkBack on Android, VoiceOver on iOS)
2. Navigate through wizard
3. Verify all labels are announced
4. Verify error messages are announced
5. Verify button states are announced
6. Verify progress indicator state is announced

**Expected Result:** ✅ Screen reader compatibility verified

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] All 5 steps render correctly
- [ ] Progress indicator updates correctly
- [ ] Back navigation works on all steps
- [ ] Continue button enables/disables based on validation
- [ ] Publish button works correctly
- [ ] All validation rules are enforced
- [ ] Error messages display correctly
- [ ] Kr conversions display correctly
- [ ] Backend submission works
- [ ] Success handling closes wizard
- [ ] Error handling keeps wizard open
- [ ] All design system colors are correct
- [ ] All spacing and typography is correct
- [ ] Responsive layout works on different screen sizes

---

## Test Data Templates

### Valid Contest Data
```
Title: "Summer Photography Contest 2024"
Description: "Submit your best summer landscape photos for a chance to win amazing prizes!"
Rules: "Original photos only. No editing allowed. Must be taken during summer 2024."
Start Date: Tomorrow at 10:00 AM
End Date: 7 days from start
Entry Fee: 100
Prize 1st: 5000
Prize 2nd: 3000
Prize 3rd: 2000
```

### Invalid Contest Data (for validation testing)
```
Title: "AB" (too short)
Description: "Short" (too short)
Start Date: Tomorrow
End Date: 1 hour from start (too short duration)
Entry Fee: -100 (negative)
Team Size: 1 (too small)
Team Size: 11 (too large)
```

---

## Bug Reporting Template

When reporting bugs found during testing:

```
**Bug Title:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]

**Actual Result:** [What actually happened]

**Severity:** [Critical/High/Medium/Low]

**Screenshots:** [Attach if applicable]

**Environment:**
- Device: [Device model]
- OS: [Android/iOS version]
- App Version: [Version number]
```

---

## Test Completion Checklist

- [ ] Test 1: Individual-Only Contest Creation ✅
- [ ] Test 2: Team-Only Contest Creation ✅
- [ ] Test 3: Hybrid Contest Creation ✅
- [ ] Test 4: Validation Error Handling ✅
- [ ] Test 5: Back Navigation and Data Persistence ✅
- [ ] Test 6: Progress Indicator Visual States ✅
- [ ] Test 7: Mutual Exclusivity Constraints ✅
- [ ] Test 8: Judge Assignment Based on Selection Method ✅
- [ ] Test 9: Kr Currency Conversion Display ✅
- [ ] Test 10: Backend Integration and Error Handling ✅
- [ ] Test 11: Task Management ✅
- [ ] Test 12: Review Card Completeness ✅
- [ ] Test 13: Large Data Handling ✅
- [ ] Test 14: Keyboard Navigation ✅
- [ ] Test 15: Screen Reader Compatibility ✅

---

## Conclusion

This comprehensive E2E testing guide covers all aspects of the Contest Creation Wizard:
- Complete wizard flows for all participation types
- Validation error handling for all steps
- Navigation and data persistence
- Visual state verification
- Mutual exclusivity constraints
- Backend integration and error handling
- Performance and accessibility testing

All tests should pass before considering the wizard production-ready.
