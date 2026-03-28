@echo off
title Fatura Takip
color 0A
echo.
echo  ================================================
echo   Fatura Takip - Baslatiliyor...
echo  ================================================
echo.

cd /d C:\Users\idemi\Desktop\verdent-project\frontend

echo  [1/2] Uygulama derleniyor, lutfen bekleyin...
call npm run build
if errorlevel 1 (
  echo  HATA: Derleme basarisiz!
  pause
  exit /b
)

echo  [2/2] Sunucu baslatiliyor...
cd /d C:\Users\idemi\Desktop\verdent-project\backend
start "Fatura Takip Sunucu" cmd /k "node server.js"

timeout /t 3 /nobreak >nul
start "" "http://localhost:3001"

echo.
echo  Uygulama acildi!
echo  Diger PC-ler icin sunucu penceresindeki IP adresine bakin.
echo.
