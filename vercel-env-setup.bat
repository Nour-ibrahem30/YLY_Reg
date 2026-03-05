@echo off
REM Vercel Environment Variables Setup Script for Windows
REM Run this script to add all environment variables to Vercel

echo 🚀 Setting up Vercel Environment Variables...
echo.

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vercel CLI is not installed
    echo 📦 Installing Vercel CLI...
    call npm install -g vercel
)

echo 🔐 Please login to Vercel...
call vercel login

echo.
echo 🔗 Linking project...
call vercel link

echo.
echo 📝 Adding environment variables...
echo.

REM Supabase (already known)
echo Adding REACT_APP_SUPABASE_URL...
echo https://zidakvdpucmdotxdrfcs.supabase.co | vercel env add REACT_APP_SUPABASE_URL production

echo Adding REACT_APP_SUPABASE_ANON_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppZGFrdmRwdWNtZG90eGRyZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzYwNzcsImV4cCI6MjA4ODMxMjA3N30.XDvftpBlrneSzqHYELvL0u1afNEVsI_5ypEtLFv5FZE | vercel env add REACT_APP_SUPABASE_ANON_KEY production

REM Firebase (need user input)
echo.
echo 🔥 Firebase Configuration
echo Please enter your Firebase credentials:
echo.

set /p firebase_api_key="REACT_APP_FIREBASE_API_KEY: "
echo %firebase_api_key% | vercel env add REACT_APP_FIREBASE_API_KEY production

set /p firebase_auth_domain="REACT_APP_FIREBASE_AUTH_DOMAIN: "
echo %firebase_auth_domain% | vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN production

set /p firebase_project_id="REACT_APP_FIREBASE_PROJECT_ID: "
echo %firebase_project_id% | vercel env add REACT_APP_FIREBASE_PROJECT_ID production

set /p firebase_storage_bucket="REACT_APP_FIREBASE_STORAGE_BUCKET: "
echo %firebase_storage_bucket% | vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET production

set /p firebase_sender_id="REACT_APP_FIREBASE_MESSAGING_SENDER_ID: "
echo %firebase_sender_id% | vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID production

set /p firebase_app_id="REACT_APP_FIREBASE_APP_ID: "
echo %firebase_app_id% | vercel env add REACT_APP_FIREBASE_APP_ID production

echo.
echo ✅ All environment variables added!
echo.
echo 🚀 Deploying to production...
call vercel --prod

echo.
echo 🎉 Done! Your app is now deployed with all environment variables.
pause
