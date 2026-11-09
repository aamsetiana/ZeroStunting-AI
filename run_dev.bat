@echo off
echo ========================================================
echo        Menjalankan Server Ananta (ZeroStunting AI)
echo ========================================================
echo.
echo [1/2] Menjalankan Backend FastAPI di jendela baru (Port 8000)...
start "Ananta Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Menjalankan Frontend Next.js di jendela baru (Port 3000)...
start "Ananta Frontend (Next.js)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  Kedua server telah dijalankan di jendela terpisah!
echo.
echo  - Frontend Web App : http://localhost:3000
echo  - Backend API Docs : http://127.0.0.1:8000/docs
echo ========================================================
echo.
echo Tekan sembarang tombol untuk menutup jendela launcher ini.
pause >nul

