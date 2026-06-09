# Comment API Test Script (PowerShell)
# This script tests the comment functionality to ensure it's working

param(
    [string]$ApiBaseUrl = "http://localhost:3000/api/v1",
    [string]$AuthToken = "",
    [string]$ContentId = "test-short-id",
    [string]$ContentType = "short"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Comment API Test Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "API Base URL: $ApiBaseUrl"
Write-Host "Content ID: $ContentId"
Write-Host "Content Type: $ContentType"
Write-Host ""

# Test 1: Health check for comments API
Write-Host "Test 1: Testing comments API accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/comments/test" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Get comments (no auth required)
Write-Host "Test 2: Getting comments for content..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/comments?contentType=$ContentType&contentId=$ContentId&sortBy=latest&limit=20" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create comment (requires auth)
if ($AuthToken) {
    Write-Host "Test 3: Creating a comment..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $AuthToken"
            "Content-Type" = "application/json"
        }
        $body = @{
            text = "Test comment from PowerShell script"
            parent_id = $null
            replyToUserId = $null
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/comments?contentType=$ContentType&contentId=$ContentId" -Method Post -Headers $headers -Body $body
        $response | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    }
} else {
    Write-Host "Test 3: Skipped (no AuthToken provided)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run with authentication:" -ForegroundColor Green
Write-Host '  .\test-comments.ps1 -AuthToken "your-jwt-token" -ContentId "actual-content-id"' -ForegroundColor Green
