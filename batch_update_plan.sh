#!/bin/bash
# Batch update script for remaining toDoubleOrNull() conversions
# This script documents the changes needed for each file

echo "=== REMAINING FILES TO UPDATE ==="
echo ""

echo "1. Step4PrizesAndValidation.kt (2 occurrences - lines 222, 663)"
echo "   Pattern: val newAmount = it.toDoubleOrNull() ?: 0.0"
echo "   Replace with: SafeConversion.toDoubleOrDefaultWithValidation(it, \"prizeAmount\", 0.0, 0.0)"
echo ""

echo "2. CampaignScreens.kt (1 occurrence - line 195)"
echo "   Pattern: budget.toDoubleOrNull() ?: 0.0"
echo "   Replace with: SafeConversion.toDoubleOrDefaultWithValidation(budget, \"campaignBudget\", 0.0, 0.0)"
echo ""

echo "3. SponsorAndGamificationScreens.kt (1 occurrence - line 123)"
echo "   Pattern: amount.toDoubleOrNull() ?: 0.0"
echo "   Replace with: SafeConversion.toDoubleOrDefaultWithValidation(amount, \"sponsorAmount\", 0.0, 0.0)"
echo ""

echo "4. SubscriptionTierSetupViewModel.kt (1 occurrence)"
echo "   Pattern: krAmount = it.krAmount.toDoubleOrNull() ?: 0.0"
echo "   Replace with: SafeConversion.toDoubleOrDefaultWithValidation(it.krAmount, \"subscriptionAmount\", 0.0, 0.0)"
echo ""

echo "5. CreateListingViewModel.kt (1 occurrence)"
echo "   Pattern: val price = s.priceKr.toDoubleOrNull()"
echo "   Replace with: if (s.priceKr.isNotEmpty()) SafeConversion.toDoubleOrDefaultWithValidation(...) else null"
echo ""

echo "6. CreateCampaignScreen.kt (2 occurrences)"
echo "   Pattern: budget = budget.toDoubleOrNull() ?: 0.0"
echo "   Pattern: bidAmount = bidAmount.toDoubleOrNull() ?: 0.0"
echo ""

echo "7. WithdrawScreen.kt (1 occurrence)"
echo "   Pattern: val amount = state.amount.toDoubleOrNull() ?: return false"
echo ""

echo "8. WithdrawViewModel.kt (1 occurrence - different from already updated)"
echo "   Pattern: val amount = _state.value.amount.toDoubleOrNull()"
echo ""

echo "=== TOTAL: 11 occurrences across 8 files ==="
