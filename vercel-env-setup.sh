#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this script to add all environment variables to Vercel

echo "🚀 Setting up Vercel Environment Variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Please login to Vercel..."
vercel login

echo ""
echo "🔗 Linking project..."
vercel link

echo ""
echo "📝 Adding environment variables..."
echo ""

# Supabase (already known)
echo "Adding REACT_APP_SUPABASE_URL..."
echo "https://zidakvdpucmdotxdrfcs.supabase.co" | vercel env add REACT_APP_SUPABASE_URL production

echo "Adding REACT_APP_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppZGFrdmRwdWNtZG90eGRyZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzYwNzcsImV4cCI6MjA4ODMxMjA3N30.XDvftpBlrneSzqHYELvL0u1afNEVsI_5ypEtLFv5FZE" | vercel env add REACT_APP_SUPABASE_ANON_KEY production

# Firebase (need user input)
echo ""
echo "🔥 Firebase Configuration"
echo "Please enter your Firebase credentials:"
echo ""

read -p "REACT_APP_FIREBASE_API_KEY: " firebase_api_key
echo "$firebase_api_key" | vercel env add REACT_APP_FIREBASE_API_KEY production

read -p "REACT_APP_FIREBASE_AUTH_DOMAIN: " firebase_auth_domain
echo "$firebase_auth_domain" | vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN production

read -p "REACT_APP_FIREBASE_PROJECT_ID: " firebase_project_id
echo "$firebase_project_id" | vercel env add REACT_APP_FIREBASE_PROJECT_ID production

read -p "REACT_APP_FIREBASE_STORAGE_BUCKET: " firebase_storage_bucket
echo "$firebase_storage_bucket" | vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET production

read -p "REACT_APP_FIREBASE_MESSAGING_SENDER_ID: " firebase_sender_id
echo "$firebase_sender_id" | vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID production

read -p "REACT_APP_FIREBASE_APP_ID: " firebase_app_id
echo "$firebase_app_id" | vercel env add REACT_APP_FIREBASE_APP_ID production

echo ""
echo "✅ All environment variables added!"
echo ""
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "🎉 Done! Your app is now deployed with all environment variables."
