# Requirements Document: Contest Creation Wizard

## Introduction

The Contest Creation Wizard is a comprehensive 5-step form interface for creating parent contests with team participation options in the Krieta mobile application. The wizard guides contest creators through details configuration, audience targeting, task setup, prize distribution, and final review with judge assignment. The system supports individual-only, team-only, and hybrid participation modes with full integration to the existing teams module and backend contest service.

## Glossary

- **Contest_Creation_Wizard**: The 5-step form interface for creating contests
- **Contest_Creator**: The authenticated user creating a contest
- **Participation_Type**: The mode of contest participation (INDIVIDUAL_ONLY, TEAM_ONLY, BOTH)
- **Team_Size_Requirement**: Optional constraint on the number of members required in a team
- **Max_Teams_Limit**: Optional constraint on the maximum number of teams that can register
- **Task**: A required action participants must complete to enter the contest
- **Task_Type**: The category of task (Follow Krieta, Subscribe YouTube, Follow Spotify, Follow Instagram, Follow TikTok, Watch Video, Visit Shop, Custom Task)
- **Prize_Pool**: The total Kr amount available for distribution to winners
- **Selection_Method**: The mechanism for determining winners (MANUAL, RANDOM, VOTING, COMBINATION)
- **Judge**: An authorized user who can evaluate submissions for manual selection
- **Entry_Fee**: The Kr amount each participant must pay to enter the contest
- **Paid_Voting**: A voting mechanism where users pay Kr to vote for submissions
- **Milestone_Airdrop**: A FOMO feature that distributes Kr to early participants
- **Duration**: The time span between contest start and end dates
- **Demographics_Lock**: A feature that restricts contest participation by age range and location
- **Native_OS_Picker**: Platform-specific date/time selection UI component
- **Kr_Conversion**: Real-time display of local currency amounts in Kr
- **Progress_Indicator**: Visual representation of the current step in the wizard
- **Backend_Contest_Service**: The Node.js/Express service handling contest creation via POST /api/v1/contests
- **Prisma_Schema**: The database schema defining contest fields including participationType, teamSize, maxTeams
- **Teams_Module**: The existing system for team registration and submission capabilities
- **Validation_Rule**: A constraint that must be satisfied before proceeding to the next step
- **Review_Card**: A summary display of all configured settings before publishing

## Requirements

### Requirement 1: Wizard Navigation and Progress

**User Story:** As a Contest Creator, I want to navigate through a 5-step wizard with clear progress indication, so that I understand where I am in the contest creation process.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL display a Progress_Indicator showing all 5 steps (Details & Dates, Audience & Fees, Tasks & Connectors, Prizes & Validation, Review & Judges)
2. WHEN the Contest_Creator is on step N, THE Progress_Indicator SHALL highlight steps 1 through N as active using yellow accent color (#F5A623)
3. WHEN the Contest_Creator is on step N, THE Progress_Indicator SHALL display steps N+1 through 5 as inactive using gray color (#3A3A3F)
4. WHEN the Contest_Creator clicks the back button on step 1, THE Contest_Creation_Wizard SHALL exit and return to the previous screen
5. WHEN the Contest_Creator clicks the back button on steps 2-5, THE Contest_Creation_Wizard SHALL navigate to the previous step
6. THE Contest_Creation_Wizard SHALL display a bottom action bar with "Continue" button on steps 1-4
7. THE Contest_Creation_Wizard SHALL display a bottom action bar with "Publish Contest" button on step 5
8. WHEN the current step has invalid data, THE Contest_Creation_Wizard SHALL disable the action button
9. WHEN the Contest_Creator completes step 5 and clicks "Publish Contest", THE Contest_Creation_Wizard SHALL submit the contest to Backend_Contest_Service and close upon success

### Requirement 2: Step 1 - Contest Details and Dates

**User Story:** As a Contest Creator, I want to enter basic contest information and schedule dates, so that participants know what the contest is about and when it runs.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a text input field for contest title with minimum length 3 characters and maximum length 80 characters
2. THE Contest_Creation_Wizard SHALL provide a multiline text input field for description with minimum length 10 characters
3. THE Contest_Creation_Wizard SHALL provide a multiline text input field for specific rules (optional)
4. THE Contest_Creation_Wizard SHALL provide a Native_OS_Picker for start date and time selection
5. THE Contest_Creation_Wizard SHALL provide a Native_OS_Picker for end date and time selection
6. WHEN the Contest_Creator selects start and end dates, THE Contest_Creation_Wizard SHALL automatically calculate and display the Duration
7. WHEN the calculated Duration is less than 2 hours, THE Contest_Creation_Wizard SHALL display a validation error and disable the Continue button
8. THE Contest_Creation_Wizard SHALL provide an optional text input field for example content URL
9. WHEN the Contest_Creator attempts to continue from step 1 with title length less than 3 or greater than 80, THE Contest_Creation_Wizard SHALL display a validation error
10. WHEN the Contest_Creator attempts to continue from step 1 with description length less than 10, THE Contest_Creation_Wizard SHALL display a validation error

### Requirement 3: Step 2 - Audience Demographics and Targeting

**User Story:** As a Contest Creator, I want to restrict contest participation by demographics, so that I can target specific age groups and locations.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a Demographics_Lock toggle switch
2. WHEN Demographics_Lock is enabled, THE Contest_Creation_Wizard SHALL display age range input fields for minimum age and maximum age
3. WHEN Demographics_Lock is enabled, THE Contest_Creation_Wizard SHALL display a text input field for target locations (comma-separated)
4. WHEN Demographics_Lock is disabled, THE Contest_Creation_Wizard SHALL hide age range and location input fields
5. WHEN Demographics_Lock is enabled and the Contest_Creator attempts to continue with invalid age range (min > max), THE Contest_Creation_Wizard SHALL display a validation error

### Requirement 4: Step 2 - Team Participation Configuration

**User Story:** As a Contest Creator, I want to configure team participation options, so that I can create contests for individuals, teams, or both.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a Participation_Type selector with three options: "Individual Only", "Team Only", "Both"
2. WHEN Participation_Type is set to "Individual Only", THE Contest_Creation_Wizard SHALL set participationType field to INDIVIDUAL_ONLY
3. WHEN Participation_Type is set to "Team Only", THE Contest_Creation_Wizard SHALL set participationType field to TEAM_ONLY and display team configuration fields
4. WHEN Participation_Type is set to "Both", THE Contest_Creation_Wizard SHALL set participationType field to BOTH and display team configuration fields
5. WHEN Participation_Type is "Team Only" or "Both", THE Contest_Creation_Wizard SHALL display an optional Team_Size_Requirement input field
6. WHEN Participation_Type is "Team Only" or "Both", THE Contest_Creation_Wizard SHALL display an optional Max_Teams_Limit input field
7. WHEN Team_Size_Requirement is specified, THE Contest_Creation_Wizard SHALL validate that the value is between 2 and 10 members
8. WHEN Max_Teams_Limit is specified, THE Contest_Creation_Wizard SHALL validate that the value is a positive integer

### Requirement 5: Step 2 - Entry Fee Configuration

**User Story:** As a Contest Creator, I want to set an optional entry fee in local currency, so that I can create paid contests with prize pool contributions.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a numeric input field for participation fee in local currency
2. WHEN the Contest_Creator enters a participation fee amount, THE Contest_Creation_Wizard SHALL display the real-time Kr_Conversion equivalent
3. WHEN the Contest_Creator enters a negative participation fee, THE Contest_Creation_Wizard SHALL display a validation error
4. THE Contest_Creation_Wizard SHALL allow zero or empty participation fee for free contests

### Requirement 6: Step 3 - Task Type Selection and Configuration

**User Story:** As a Contest Creator, I want to add multiple tasks with type-specific fields, so that participants must complete required actions to enter the contest.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a Task_Type selector with 8 options: Follow Krieta, Subscribe YouTube, Follow Spotify, Follow Instagram, Follow TikTok, Watch Video, Visit Shop, Custom Task
2. WHEN Task_Type is "Follow Krieta", THE Contest_Creation_Wizard SHALL display a text input field with live autocomplete for Krieta usernames
3. WHEN Task_Type is "Subscribe YouTube", THE Contest_Creation_Wizard SHALL display a text input field for YouTube channel URL
4. WHEN Task_Type is "Follow Spotify", THE Contest_Creation_Wizard SHALL display a text input field for Spotify artist URL
5. WHEN Task_Type is "Follow Instagram", THE Contest_Creation_Wizard SHALL display a text input field for Instagram username
6. WHEN Task_Type is "Follow TikTok", THE Contest_Creation_Wizard SHALL display a text input field for TikTok username
7. WHEN Task_Type is "Watch Video", THE Contest_Creation_Wizard SHALL display a text input field for video URL
8. WHEN Task_Type is "Visit Shop", THE Contest_Creation_Wizard SHALL display a text input field for shop URL
9. WHEN Task_Type is "Custom Task", THE Contest_Creation_Wizard SHALL display a text input field for custom task description
10. WHEN the Contest_Creator completes task configuration, THE Contest_Creation_Wizard SHALL provide an "Add Task" button
11. WHEN the Contest_Creator clicks "Add Task" with valid task data, THE Contest_Creation_Wizard SHALL add the Task to the added tasks list
12. THE Contest_Creation_Wizard SHALL display all added tasks in a list with remove capability
13. WHEN the Contest_Creator clicks remove on a Task, THE Contest_Creation_Wizard SHALL remove the Task from the added tasks list
14. WHEN the Contest_Creator attempts to continue from step 3 with zero tasks added, THE Contest_Creation_Wizard SHALL display a validation error and disable the Continue button

### Requirement 7: Step 4 - Prize Distribution Configuration

**User Story:** As a Contest Creator, I want to configure prize distribution for multiple winners, so that I can reward top performers.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a winner slots selector with options 1, 2, or 3
2. WHEN winner slots is set to 1, THE Contest_Creation_Wizard SHALL display one prize input field for 1st place
3. WHEN winner slots is set to 2, THE Contest_Creation_Wizard SHALL display two prize input fields for 1st and 2nd place
4. WHEN winner slots is set to 3, THE Contest_Creation_Wizard SHALL display three prize input fields for 1st, 2nd, and 3rd place
5. WHEN the Contest_Creator enters prize amounts, THE Contest_Creation_Wizard SHALL display real-time Kr_Conversion for each prize
6. WHEN the Contest_Creator enters prize amounts, THE Contest_Creation_Wizard SHALL calculate and display the total Prize_Pool
7. WHEN the Contest_Creator enters a negative prize amount, THE Contest_Creation_Wizard SHALL display a validation error

### Requirement 8: Step 4 - Winner Selection Method

**User Story:** As a Contest Creator, I want to choose how winners are selected, so that I can use manual judging, random selection, voting, or a combination.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a Selection_Method selector with four options: MANUAL, RANDOM, VOTING, COMBINATION
2. WHEN Selection_Method is set to MANUAL, THE Contest_Creation_Wizard SHALL enable judge assignment in step 5
3. WHEN Selection_Method is set to RANDOM, THE Contest_Creation_Wizard SHALL disable judge assignment in step 5
4. WHEN Selection_Method is set to VOTING, THE Contest_Creation_Wizard SHALL disable judge assignment in step 5
5. WHEN Selection_Method is set to COMBINATION, THE Contest_Creation_Wizard SHALL enable judge assignment in step 5

### Requirement 9: Step 4 - Paid Voting and Entry Fee Mutual Exclusivity

**User Story:** As a Contest Creator, I want to enable paid voting as an alternative to entry fees, so that I can monetize through voting instead of entry barriers.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a Paid_Voting toggle switch
2. WHEN Paid_Voting is enabled and Entry_Fee is greater than zero, THE Contest_Creation_Wizard SHALL display a validation error stating "Entry fee and paid voting are mutually exclusive"
3. WHEN Entry_Fee is greater than zero and the Contest_Creator attempts to enable Paid_Voting, THE Contest_Creation_Wizard SHALL display a validation error stating "Entry fee and paid voting are mutually exclusive"
4. WHEN Paid_Voting is enabled, THE Contest_Creation_Wizard SHALL allow Entry_Fee to be zero or empty only

### Requirement 10: Step 4 - Milestone Airdrop Configuration

**User Story:** As a Contest Creator, I want to configure milestone airdrops, so that I can create FOMO by rewarding early participants.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL provide a Milestone_Airdrop section with toggle switch
2. WHEN Milestone_Airdrop is enabled, THE Contest_Creation_Wizard SHALL display a numeric input field for airdrop Kr amount per participant
3. WHEN Milestone_Airdrop is enabled, THE Contest_Creation_Wizard SHALL display a numeric input field for airdrop participant limit
4. WHEN the Contest_Creator enters airdrop Kr amount, THE Contest_Creation_Wizard SHALL validate that the value is positive
5. WHEN the Contest_Creator enters airdrop participant limit, THE Contest_Creation_Wizard SHALL validate that the value is a positive integer

### Requirement 11: Step 5 - Judge Assignment

**User Story:** As a Contest Creator, I want to assign judges for manual or combination selection methods, so that qualified users can evaluate submissions.

#### Acceptance Criteria

1. WHEN Selection_Method is MANUAL or COMBINATION, THE Contest_Creation_Wizard SHALL display a judge assignment interface
2. WHEN Selection_Method is RANDOM or VOTING, THE Contest_Creation_Wizard SHALL hide the judge assignment interface
3. THE Contest_Creation_Wizard SHALL provide a search interface for finding users to assign as judges
4. WHEN the Contest_Creator adds a Judge, THE Contest_Creation_Wizard SHALL add the Judge to the judges list
5. WHEN the judges list contains 15 judges, THE Contest_Creation_Wizard SHALL disable the ability to add more judges
6. THE Contest_Creation_Wizard SHALL provide a remove button for each Judge in the judges list
7. WHEN the Contest_Creator clicks remove on a Judge, THE Contest_Creation_Wizard SHALL remove the Judge from the judges list

### Requirement 12: Step 5 - Final Review and Configuration Summary

**User Story:** As a Contest Creator, I want to review all configured settings before publishing, so that I can verify the contest is set up correctly.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL display a Review_Card showing contest title, description, and rules
2. THE Contest_Creation_Wizard SHALL display a Review_Card showing start date, end date, and calculated Duration
3. THE Contest_Creation_Wizard SHALL display a Review_Card showing Participation_Type, Team_Size_Requirement, and Max_Teams_Limit (when applicable)
4. THE Contest_Creation_Wizard SHALL display a Review_Card showing Demographics_Lock settings including age range and target locations (when applicable)
5. THE Contest_Creation_Wizard SHALL display a Review_Card showing Entry_Fee or Paid_Voting status
6. THE Contest_Creation_Wizard SHALL display a Review_Card showing all added tasks with their types and configurations
7. THE Contest_Creation_Wizard SHALL display a Review_Card showing Prize_Pool distribution across all winner slots
8. THE Contest_Creation_Wizard SHALL display a Review_Card showing Selection_Method and assigned judges (when applicable)
9. THE Contest_Creation_Wizard SHALL display a Review_Card showing Milestone_Airdrop configuration (when applicable)

### Requirement 13: Backend Integration and Contest Publishing

**User Story:** As a Contest Creator, I want the wizard to submit my contest to the backend service, so that the contest is created in the database and available to participants.

#### Acceptance Criteria

1. WHEN the Contest_Creator clicks "Publish Contest" on step 5, THE Contest_Creation_Wizard SHALL construct a request payload including all configured fields
2. THE Contest_Creation_Wizard SHALL include participationType field in the request payload with value INDIVIDUAL_ONLY, TEAM_ONLY, or BOTH
3. WHEN Team_Size_Requirement is specified, THE Contest_Creation_Wizard SHALL include teamSize field in the request payload
4. WHEN Max_Teams_Limit is specified, THE Contest_Creation_Wizard SHALL include maxTeams field in the request payload
5. THE Contest_Creation_Wizard SHALL send a POST request to Backend_Contest_Service endpoint /api/v1/contests
6. WHEN Backend_Contest_Service returns a success response (HTTP 201), THE Contest_Creation_Wizard SHALL display a success message and close the wizard
7. WHEN Backend_Contest_Service returns an error response (HTTP 4xx or 5xx), THE Contest_Creation_Wizard SHALL display the error message and remain on step 5
8. WHILE the request is in progress, THE Contest_Creation_Wizard SHALL display a loading indicator on the "Publish Contest" button
9. WHILE the request is in progress, THE Contest_Creation_Wizard SHALL disable the "Publish Contest" button

### Requirement 14: Design System Compliance

**User Story:** As a Contest Creator, I want the wizard to follow the Krieta design system, so that the interface is consistent with the rest of the application.

#### Acceptance Criteria

1. THE Contest_Creation_Wizard SHALL use yellow accent color (#F5A623) for active states, primary buttons, and highlights
2. THE Contest_Creation_Wizard SHALL use dark background color (#0A0A0F) for the main container
3. THE Contest_Creation_Wizard SHALL use dark surface color (#1A1A1F) for the bottom action bar
4. THE Contest_Creation_Wizard SHALL use gray color (#3A3A3F) for inactive states and disabled buttons
5. THE Contest_Creation_Wizard SHALL use rounded corners (12dp) for buttons and cards
6. THE Contest_Creation_Wizard SHALL use bold font weight for button text and section headers
7. THE Contest_Creation_Wizard SHALL use 20dp horizontal padding for content areas
8. THE Contest_Creation_Wizard SHALL use 8dp shadow elevation for the bottom action bar

### Requirement 15: Real-Time Validation and User Feedback

**User Story:** As a Contest Creator, I want immediate feedback on validation errors, so that I can correct mistakes before attempting to proceed.

#### Acceptance Criteria

1. WHEN the Contest_Creator enters invalid data in any input field, THE Contest_Creation_Wizard SHALL display an inline error message below the field
2. WHEN the Contest_Creator corrects invalid data, THE Contest_Creation_Wizard SHALL remove the error message immediately
3. WHEN the current step has any Validation_Rule violations, THE Contest_Creation_Wizard SHALL disable the Continue or Publish button
4. WHEN the current step satisfies all Validation_Rules, THE Contest_Creation_Wizard SHALL enable the Continue or Publish button
5. THE Contest_Creation_Wizard SHALL validate input fields in real-time as the Contest_Creator types

### Requirement 16: Team Participation Integration with Teams Module

**User Story:** As a Contest Creator, I want team participation settings to integrate with the existing Teams Module, so that teams can register and submit entries according to the configured rules.

#### Acceptance Criteria

1. WHEN a contest is created with participationType set to TEAM_ONLY, THE Teams_Module SHALL allow team registration for the contest
2. WHEN a contest is created with participationType set to TEAM_ONLY, THE Teams_Module SHALL prevent individual registration for the contest
3. WHEN a contest is created with participationType set to BOTH, THE Teams_Module SHALL allow both team and individual registration for the contest
4. WHEN a contest is created with participationType set to INDIVIDUAL_ONLY, THE Teams_Module SHALL prevent team registration for the contest
5. WHEN a contest is created with Team_Size_Requirement, THE Teams_Module SHALL validate that registering teams have exactly the specified number of members
6. WHEN a contest is created with Max_Teams_Limit, THE Teams_Module SHALL prevent team registration when the limit is reached

## Correctness Properties

### Property 1: Step Progression Invariant

**Property:** FOR ALL valid wizard states, the current step number SHALL be between 1 and 5 inclusive.

**Test Strategy:** Property-based test generating random navigation sequences (next, previous) and verifying step number remains in bounds.

### Property 2: Validation State Consistency

**Property:** FOR ALL wizard steps, IF any Validation_Rule is violated, THEN the action button SHALL be disabled.

**Test Strategy:** Property-based test generating random input combinations for each step and verifying button state matches validation state.

### Property 3: Team Configuration Visibility

**Property:** FOR ALL Participation_Type values, IF Participation_Type is TEAM_ONLY or BOTH, THEN team configuration fields SHALL be visible, ELSE team configuration fields SHALL be hidden.

**Test Strategy:** Property-based test cycling through all Participation_Type values and verifying field visibility matches expected state.

### Property 4: Entry Fee and Paid Voting Mutual Exclusivity

**Property:** FOR ALL contest configurations, IF Entry_Fee is greater than zero, THEN Paid_Voting SHALL be disabled, AND IF Paid_Voting is enabled, THEN Entry_Fee SHALL be zero or empty.

**Test Strategy:** Property-based test generating random Entry_Fee and Paid_Voting combinations and verifying mutual exclusivity constraint.

### Property 5: Judge Assignment Conditional Visibility

**Property:** FOR ALL Selection_Method values, IF Selection_Method is MANUAL or COMBINATION, THEN judge assignment interface SHALL be visible, ELSE judge assignment interface SHALL be hidden.

**Test Strategy:** Property-based test cycling through all Selection_Method values and verifying judge interface visibility matches expected state.

### Property 6: Duration Calculation Correctness

**Property:** FOR ALL start and end date combinations, the calculated Duration SHALL equal the difference between end date and start date.

**Test Strategy:** Property-based test generating random date pairs and verifying Duration calculation accuracy.

### Property 7: Prize Pool Summation

**Property:** FOR ALL prize distribution configurations, the displayed Prize_Pool SHALL equal the sum of all individual prize amounts.

**Test Strategy:** Property-based test generating random prize amounts for 1-3 winners and verifying Prize_Pool calculation.

### Property 8: Backend Payload Completeness

**Property:** FOR ALL contest configurations, the request payload sent to Backend_Contest_Service SHALL include all required fields defined in the Prisma_Schema.

**Test Strategy:** Property-based test generating random contest configurations and verifying payload contains all required fields (title, description, participationType, etc.).

### Property 9: Team Size Validation Range

**Property:** FOR ALL Team_Size_Requirement values, IF Team_Size_Requirement is specified, THEN the value SHALL be between 2 and 10 inclusive.

**Test Strategy:** Property-based test generating random Team_Size_Requirement values and verifying validation accepts 2-10 and rejects values outside this range.

### Property 10: Judge Limit Enforcement

**Property:** FOR ALL judge assignment operations, the judges list SHALL contain at most 15 judges.

**Test Strategy:** Property-based test attempting to add more than 15 judges and verifying the system prevents additions beyond the limit.

### Property 11: Task List Non-Empty Constraint

**Property:** FOR ALL step 3 completion attempts, IF the added tasks list is empty, THEN the Continue button SHALL be disabled.

**Test Strategy:** Property-based test with various task list states (empty, 1 task, multiple tasks) and verifying button state.

### Property 12: Kr Conversion Consistency

**Property:** FOR ALL local currency amounts, the displayed Kr_Conversion SHALL be consistent with the platform's conversion rate.

**Test Strategy:** Property-based test generating random local currency amounts and verifying Kr conversion calculations are consistent and deterministic.

### Property 13: Progress Indicator State Accuracy

**Property:** FOR ALL wizard states, the Progress_Indicator SHALL highlight exactly steps 1 through current step as active.

**Test Strategy:** Property-based test navigating through all steps and verifying Progress_Indicator highlights match current step.

### Property 14: Validation Error Message Presence

**Property:** FOR ALL invalid input states, THE Contest_Creation_Wizard SHALL display at least one error message.

**Test Strategy:** Property-based test generating invalid inputs for each field type and verifying error messages appear.

### Property 15: Review Card Data Completeness

**Property:** FOR ALL contest configurations, the Review_Card SHALL display all non-empty configured fields.

**Test Strategy:** Property-based test generating random contest configurations and verifying Review_Card includes all specified fields.
