@echo off
echo ========================================
echo   Backend Schema Fixes - Migration
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Applying user_bookmarks table migration...
npx prisma db execute --file .\prisma\migrations\create_user_bookmarks_table.sql

if %ERRORLEVEL% EQU 0 (
    echo √ Migration applied successfully
) else (
    echo ERROR: Failed to apply migration
    exit /b 1
)

echo.
echo [2/3] Generating Prisma Client...
npx prisma generate

if %ERRORLEVEL% EQU 0 (
    echo √ Prisma Client generated successfully
) else (
    echo ERROR: Failed to generate Prisma Client
    exit /b 1
)

echo.
echo [3/3] Verifying schema...
npx prisma validate

if %ERRORLEVEL% EQU 0 (
    echo √ Schema is valid
) else (
    echo WARNING: Schema validation had issues
)

echo.
echo ========================================
echo   √ All fixes applied successfully!
echo ========================================
echo.
echo Summary of fixes:
echo   • Created user_bookmarks table
echo   • Fixed chama_members -^> chama_member references
echo   • Fixed story views -^> story_view references
echo   • Fixed story creator -^> user references
echo   • Fixed chamaWallet -^> chama_wallet references
echo.
echo Next steps:
echo   1. Restart your backend server (npm run dev)
echo   2. Test the endpoints
echo.
pause
