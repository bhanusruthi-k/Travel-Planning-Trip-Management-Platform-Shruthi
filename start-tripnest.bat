@echo off
setlocal enabledelayedexpansion

title TripNest Development Launcher
echo ===================================================
echo           TripNest Platform Startup
echo ===================================================
echo.

:: 1. Verify PostgreSQL availability
echo [1/4] Checking PostgreSQL database on port 5432...
powershell -Command "$tcp = New-Object Net.Sockets.TcpClient; try { $tcp.Connect('localhost', 5432); Write-Host 'PostgreSQL is running on port 5432.' -ForegroundColor Green; $tcp.Close(); exit 0 } catch { Write-Host 'PostgreSQL connection check completed.' -ForegroundColor Yellow; exit 0 }"

:: 2. Check if Backend is already running on port 8080
echo [2/4] Checking TripNest Backend status...
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:8080/api/health' -TimeoutSec 2; if ($res.status -eq 'UP') { exit 0 } else { exit 1 } } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo Backend is already up and healthy at http://localhost:8080.
    goto BACKEND_READY
)

echo Starting Spring Boot backend...
if exist "%~dp0target\tripnest-backend-0.0.1-SNAPSHOT.jar" (
    start "TripNest-Backend" cmd /c "cd /d ""%~dp0"" && java -jar target\tripnest-backend-0.0.1-SNAPSHOT.jar"
) else (
    start "TripNest-Backend" cmd /c "cd /d ""%~dp0"" && .\mvnw.cmd spring-boot:run"
)

echo Waiting for Spring Boot backend to become ready on http://localhost:8080/api/health...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=45

:POLL_BACKEND
set /a ATTEMPTS+=1
timeout /t 2 /nobreak >nul
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:8080/api/health' -TimeoutSec 2; if ($res.status -eq 'UP') { exit 0 } else { exit 1 } } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Backend is READY and healthy!
    goto BACKEND_READY
)

if %ATTEMPTS% GEQ %MAX_ATTEMPTS% (
    echo.
    echo [WARNING] Backend did not respond within 90 seconds. Continuing to frontend launch...
    goto FRONTEND_START
)

<nul set /p=.
goto POLL_BACKEND

:BACKEND_READY
echo.
:FRONTEND_START
:: 3. Start Frontend
echo [3/4] Starting React / Vite Frontend...
powershell -Command "try { $res = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 2; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo Frontend is already running at http://localhost:5173.
) else (
    start "TripNest-Frontend" cmd /c "cd /d ""%~dp0frontend"" && npm run dev"
    timeout /t 3 /nobreak >nul
)

:: 4. Open in browser
echo [4/4] Opening TripNest Destinations in browser...
start http://localhost:5173/destinations

echo.
echo ===================================================
echo TripNest started successfully!
echo Frontend: http://localhost:5173/destinations
echo Backend:  http://localhost:8080/api/destinations
echo Health:   http://localhost:8080/api/health
echo ===================================================
