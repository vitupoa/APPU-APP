# Implementation Plan: Contest Creation Wizard

## Overview

This implementation plan breaks down the Contest Creation Wizard into discrete coding tasks that build incrementally. The wizard is a 5-step form interface for creating contests with team participation options, real-time validation, and comprehensive backend integration. Each task builds on previous work and includes specific validation and testing requirements.

## Tasks

- [x] 1. Update backend API schema for team participation fields
  - Extend the existing createContestSchema in contests.routes.ts to include team participation fields
  - Add participationType field with enum values: INDIVIDUAL_ONLY, TEAM_ONLY, BOTH
  - Add optional teamSize field for team size requirements (2-10 members)
  - Add optional maxTeams field for maximum team registration limit
  - Update Zod validation to enforce team field constraints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 13.2, 13.3, 13.4_

- [ ]* 1.1 Write property test for team participation schema validation
  - **Property 9: Team Size Validation Range**
  - **Validates: Requirements 4.7**

- [x] 2. Enhance CreateContestState data model for wizard functionality
  - [x] 2.1 Extend CreateContestState with wizard navigation fields
    - Add currentStep field (1-5) for wizard navigation
    - Add stepValidation map for per-step validation state
    - Add isStepValid function for current step validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 2.2 Add Step 1 fields to CreateContestState
    - Add title, description, rules fields with validation
    - Add startDate, endDate fields for contest scheduling
    - Add duration calculation field
    - Add exampleContentUrl optional field
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 2.3 Add Step 2 fields to CreateContestState
    - Add demographicsLock boolean field
    - Add minAge, maxAge fields for age targeting
    - Add targetLocations field for location targeting
    - Add participationType field (INDIVIDUAL_ONLY, TEAM_ONLY, BOTH)
    - Add teamSize, maxTeams optional fields
    - Add entryFee field with Kr conversion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4_

  - [x] 2.4 Add Step 3 fields to CreateContestState
    - Add taskType field for current task being configured
    - Add taskConfiguration fields for type-specific data
    - Add addedTasks list for completed task configurations
    - Add task validation functions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14_

  - [x] 2.5 Add Step 4 fields to CreateContestState
    - Add winnerSlots field (1-3) for prize distribution
    - Add prizeAmounts array for 1st, 2nd, 3rd place prizes
    - Add totalPrizePool calculation field
    - Add selectionMethod field (MANUAL, RANDOM, VOTING, COMBINATION)
    - Add paidVoting boolean field
    - Add milestoneAirdrop configuration fields
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 2.6 Add Step 5 fields to CreateContestState
    - Add judges list for manual/combination selection
    - Add judgeSearchQuery field for judge search functionality
    - Add reviewData fields for final review display
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ]* 2.7 Write property tests for state model validation
  - **Property 1: Step Progression Invariant**
  - **Validates: Requirements 1.1**

- [ ]* 2.8 Write property tests for validation state consistency
  - **Property 2: Validation State Consistency**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 3. Implement CreateContestViewModel wizard navigation logic
  - [x] 3.1 Add wizard navigation functions to CreateContestViewModel
    - Implement nextStep() function with validation checks
    - Implement previousStep() function with step bounds checking
    - Implement isStepValid() function for current step validation
    - Add step-specific validation functions for each of the 5 steps
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 3.2 Add real-time validation functions to CreateContestViewModel
    - Implement validateStep1() for title, description, dates validation
    - Implement validateStep2() for demographics and team configuration validation
    - Implement validateStep3() for task list validation
    - Implement validateStep4() for prize distribution and selection method validation
    - Implement validateStep5() for judge assignment validation
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 3.3 Add Kr conversion utility functions to CreateContestViewModel
    - Implement convertToKr() function for local currency conversion
    - Implement real-time conversion display for entry fees and prizes
    - Add currency formatting functions
    - _Requirements: 5.2, 5.3, 7.5, 7.6_

- [ ]* 3.4 Write property tests for wizard navigation logic
  - **Property 3: Team Configuration Visibility**
  - **Validates: Requirements 4.3, 4.4**

- [ ]* 3.5 Write property tests for mutual exclusivity constraints
  - **Property 4: Entry Fee and Paid Voting Mutual Exclusivity**
  - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 4. Checkpoint - Ensure state management and navigation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Step 1 - Contest Details and Dates UI
  - [x] 5.1 Create Step1DetailsAndDates composable component
    - Implement title input field with character count (3-80 chars)
    - Implement description multiline input field (min 10 chars)
    - Implement optional rules multiline input field
    - Implement optional example content URL input field
    - Add real-time validation with inline error messages
    - _Requirements: 2.1, 2.2, 2.3, 2.8, 2.9, 2.10_

  - [x] 5.2 Implement native date/time pickers for Step 1
    - Add platform-specific date picker for start date and time
    - Add platform-specific date picker for end date and time
    - Implement duration calculation and display
    - Add validation for minimum 2-hour duration
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

- [ ]* 5.3 Write property tests for duration calculation
  - **Property 6: Duration Calculation Correctness**
  - **Validates: Requirements 2.6, 2.7**

- [x] 6. Implement Step 2 - Audience Demographics and Team Configuration UI
  - [x] 6.1 Create Step2AudienceAndFees composable component
    - Implement demographics lock toggle switch
    - Implement conditional age range input fields (min/max age)
    - Implement conditional target locations input field
    - Add validation for age range (min <= max)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Implement team participation configuration UI
    - Add participation type selector (Individual Only, Team Only, Both)
    - Implement conditional team size requirement input (2-10 members)
    - Implement conditional max teams limit input
    - Add team configuration field visibility logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 6.3 Implement entry fee configuration UI
    - Add entry fee numeric input field in local currency
    - Implement real-time Kr conversion display
    - Add validation for non-negative entry fee
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 6.4 Write property tests for team configuration visibility
  - **Property 3: Team Configuration Visibility**
  - **Validates: Requirements 4.3, 4.4**

- [x] 7. Implement Step 3 - Tasks and Connectors UI
  - [x] 7.1 Create Step3TasksAndConnectors composable component
    - Implement task type selector with 8 options
    - Create type-specific input fields for each task type
    - Implement Krieta username autocomplete for Follow Krieta task
    - Add URL input fields for external platform tasks
    - Add custom task description input field
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 7.2 Implement task list management UI
    - Add "Add Task" button with validation
    - Implement added tasks list display
    - Add remove task functionality for each task
    - Implement validation for non-empty task list
    - _Requirements: 6.10, 6.11, 6.12, 6.13, 6.14_

- [ ]* 7.3 Write property tests for task list validation
  - **Property 11: Task List Non-Empty Constraint**
  - **Validates: Requirements 6.14**

- [x] 8. Implement Step 4 - Prizes and Selection Method UI
  - [x] 8.1 Create Step4PrizesAndValidation composable component
    - Implement winner slots selector (1, 2, or 3)
    - Create dynamic prize input fields based on winner slots
    - Implement real-time Kr conversion for each prize
    - Add total prize pool calculation and display
    - Add validation for non-negative prize amounts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 8.2 Implement selection method configuration UI
    - Add selection method selector (MANUAL, RANDOM, VOTING, COMBINATION)
    - Implement paid voting toggle with mutual exclusivity validation
    - Add validation error display for entry fee and paid voting conflict
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

  - [x] 8.3 Implement milestone airdrop configuration UI
    - Add milestone airdrop toggle switch
    - Implement conditional airdrop Kr amount input field
    - Implement conditional airdrop participant limit input field
    - Add validation for positive airdrop values
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 8.4 Write property tests for prize pool calculation
  - **Property 7: Prize Pool Summation**
  - **Validates: Requirements 7.6, 7.7**

- [ ]* 8.5 Write property tests for selection method visibility
  - **Property 5: Judge Assignment Conditional Visibility**
  - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

- [x] 9. Implement Step 5 - Review and Judge Assignment UI
  - [x] 9.1 Create Step5ReviewAndJudges composable component
    - Implement conditional judge assignment interface
    - Add judge search functionality with user lookup
    - Implement judges list with add/remove capabilities
    - Add validation for maximum 15 judges limit
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 9.2 Implement comprehensive review cards display
    - Create review card for contest details (title, description, rules)
    - Create review card for dates and duration
    - Create review card for participation type and team configuration
    - Create review card for demographics and targeting settings
    - Create review card for entry fee or paid voting status
    - Create review card for tasks list with configurations
    - Create review card for prize distribution and selection method
    - Create review card for judge assignments
    - Create review card for milestone airdrop settings
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ]* 9.3 Write property tests for judge limit enforcement
  - **Property 10: Judge Limit Enforcement**
  - **Validates: Requirements 11.5, 11.6**

- [ ]* 9.4 Write property tests for review card completeness
  - **Property 15: Review Card Data Completeness**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9**

- [x] 10. Implement progress indicator and bottom action bar UI
  - [x] 10.1 Create ProgressIndicator composable component
    - Implement 5-step progress visualization
    - Add step highlighting with yellow accent color (#F5A623)
    - Implement inactive step styling with gray color (#3A3A3F)
    - Add step labels and connecting lines
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 10.2 Create BottomActionBar composable component
    - Implement Continue button for steps 1-4
    - Implement Publish Contest button for step 5
    - Add button state management (enabled/disabled based on validation)
    - Implement loading indicator for contest submission
    - Apply design system colors and styling
    - _Requirements: 1.6, 1.7, 1.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ]* 10.3 Write property tests for progress indicator accuracy
  - **Property 13: Progress Indicator State Accuracy**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ] 11. Checkpoint - Ensure all UI components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement backend integration and contest publishing
  - [x] 12.1 Update CreateContestViewModel publishContest function
    - Implement comprehensive payload construction from all wizard steps
    - Add participationType, teamSize, maxTeams fields to request payload
    - Include all wizard-configured fields in backend request
    - Add request validation before submission
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 12.2 Implement contest submission and response handling
    - Add loading state management during submission
    - Implement success response handling with wizard closure
    - Implement error response handling with error display
    - Add button state management during submission
    - _Requirements: 13.6, 13.7, 13.8, 13.9_

- [ ]* 12.3 Write property tests for backend payload completeness
  - **Property 8: Backend Payload Completeness**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

- [x] 13. Implement real-time validation and error handling
  - [x] 13.1 Add comprehensive input validation to all wizard steps
    - Implement real-time validation for all input fields
    - Add inline error message display below invalid fields
    - Implement immediate error clearing when input becomes valid
    - Add validation state tracking for button enable/disable
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 13.2 Implement Kr conversion utility integration
    - Add real-time Kr conversion for entry fees
    - Add real-time Kr conversion for prize amounts
    - Add real-time Kr conversion for airdrop amounts
    - Implement consistent conversion rate usage
    - _Requirements: 5.2, 7.5, 10.3_

- [ ]* 13.3 Write property tests for Kr conversion consistency
  - **Property 12: Kr Conversion Consistency**
  - **Validates: Requirements 5.2, 7.5, 10.3**

- [ ]* 13.4 Write property tests for validation error messages
  - **Property 14: Validation Error Message Presence**
  - **Validates: Requirements 15.1, 15.2**

- [x] 14. Integrate with existing Teams Module for team participation
  - [x] 14.1 Update Teams Module to handle contest participation types
    - Modify team registration logic to check contest participationType
    - Implement team size validation against contest teamSize requirements
    - Add team registration limit enforcement for maxTeams constraint
    - Update team submission capabilities for contest entries
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 14.2 Test team participation integration
    - Verify INDIVIDUAL_ONLY contests prevent team registration
    - Verify TEAM_ONLY contests prevent individual registration
    - Verify BOTH contests allow both registration types
    
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ]* 14.3 Write integration tests for Teams Module integration
  - Test all participation type scenarios with Teams Module
  - Verify team size and limit constraints are enforced
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 15. Final integration and end-to-end testing
  - [x] 15.1 Wire all wizard components together in CreateContestScreen
    - Integrate all step components with navigation logic
    - Connect progress indicator with current step state
    - Wire bottom action bar with step validation and navigation
    - Implement back button navigation with step bounds checking
  
    - _Requirements: 1.4, 1.5, 1.9_

  - [x] 15.2 Implement design system compliance verification
    - Verify all colors match design system specifications
    - Verify all spacing and typography follows design guidelines
   
    - Verify accessibility compliance for form inputs and navigation
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ]* 15.3 Write end-to-end integration tests
  - Test complete wizard flow with all step combinations
  - Verify backend integration with all field configurations
  - Test error handling and recovery scenarios

- [x] 16. Final checkpoint - Complete wizard testing and validation
 
  - Verify all 16 requirements are implemented
  - Confirm integration with existing contest and teams systems
  - Validate design system compliance and user experience

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties from the design
- Integration tests ensure compatibility with existing Teams Module
- The implementation builds incrementally from backend schema to complete UI
- Real-time validation and Kr conversion are implemented throughout
- Design system compliance is verified in the final integration phase
