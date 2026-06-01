@echo off
echo ========================================
echo Testing Railway Backend Connectivity
echo ========================================
echo.

echo 1. Testing HTTPS connection to Railway...
curl -v https://appu-app-production.up.railway.app/api/v1/health 2>&1 | findstr /C:"Connected" /C:"200" /C:"SSL" /C:"certificate"
echo.

echo 2. Testing DNS resolution...
nslookup appu-app-production.up.railway.app
echo.

echo 3. Testing SSL certificate...
echo Q | openssl s_client -connect appu-app-production.up.railway.app:443 -servername appu-app-production.up.railway.app 2>&1 | findstr /C:"Verify return code" /C:"subject" /C:"issuer"
echo.

echo ========================================
echo Test Complete
echo ========================================
pause
