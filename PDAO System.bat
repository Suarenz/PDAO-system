@echo off
SETLOCAL EnableExtensions

:: Set paths relative to script location
set "SCRIPT_PATH=%~f0"
set "SCRIPT_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\PDAO System.lnk"
set "XAMPP_DIR=C:\xampp"
set "XAMPP_CONTROL=%XAMPP_DIR%\xampp-control.exe"
set "PROJECT_ROOT="
set "LAUNCHER_PATH="
set "PHP_CMD=php"
set "BACKEND_LOG=%TEMP%\pdao_backend.log"
set "FRONTEND_LOG=%TEMP%\pdao_frontend.log"
set "BACKEND_HELPER=%TEMP%\pdao_start_backend.bat"
set "FRONTEND_HELPER=%TEMP%\pdao_start_frontend.bat"

:: Resolve project root safely to avoid running npm in Desktop by mistake
call :TRY_PROJECT_ROOT "%SCRIPT_DIR%"
if defined PROJECT_ROOT goto PROJECT_ROOT_FOUND

for %%A in ("%SCRIPT_DIR%..") do call :TRY_PROJECT_ROOT "%%~fA\"
if defined PROJECT_ROOT goto PROJECT_ROOT_FOUND

for %%A in ("%SCRIPT_DIR%..\..") do call :TRY_PROJECT_ROOT "%%~fA\"
if defined PROJECT_ROOT goto PROJECT_ROOT_FOUND

call :TRY_PROJECT_ROOT "%USERPROFILE%\Desktop\PDAO System - PAGSANJAN\"
if defined PROJECT_ROOT goto PROJECT_ROOT_FOUND

echo [ERROR] Could not locate the project root.
echo [ERROR] Required: package.json and server\artisan in the same root folder.
pause
exit /b 1

:PROJECT_ROOT_FOUND
set "LAUNCHER_PATH=%PROJECT_ROOT%PDAO System.bat"

if exist "%XAMPP_DIR%\php\php.exe" (
    set "PHP_CMD=%XAMPP_DIR%\php\php.exe"
) else (
    where php >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] PHP was not found. Install PHP or XAMPP PHP at "%XAMPP_DIR%\php\php.exe".
        pause
        exit /b 1
    )
)

:: Pick an icon if available
set "ICON_PATH=%PROJECT_ROOT%server\public\PDAO LOGO2.ico"
if not exist "%ICON_PATH%" set "ICON_PATH=%SCRIPT_DIR%public\favicon.ico"

:: Always repair Desktop shortcut so stale targets are fixed
echo [INFO] Verifying Desktop shortcut...
powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$s = $ws.CreateShortcut('%SHORTCUT_PATH%'); " ^
    "$s.TargetPath = '%LAUNCHER_PATH%'; " ^
    "$s.IconLocation = '%ICON_PATH%'; " ^
    "$s.WorkingDirectory = '%PROJECT_ROOT%'; " ^
    "$s.Save()"
if errorlevel 1 (
    echo [WARN] Failed to update shortcut.
) else (
    echo [SUCCESS] Shortcut is ready.
)

TITLE PDAO Startup Monitor

:: Move to the project root directory
cd /d "%PROJECT_ROOT%"

if not exist "package.json" (
    echo [ERROR] package.json not found in "%CD%".
    pause
    exit /b 1
)

:: Open XAMPP control panel (if installed)
if exist "%XAMPP_CONTROL%" (
    echo [INFO] Opening XAMPP Control Panel...
    start "XAMPP Control" "%XAMPP_CONTROL%"
) else (
    echo [WARN] XAMPP Control Panel not found at "%XAMPP_CONTROL%".
)

:: Start MySQL service binary if not already running
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
if errorlevel 1 (
    if exist "%XAMPP_DIR%\mysql\bin\mysqld.exe" (
        echo [INFO] Starting MySQL server...
        start /min "MySQL" "%XAMPP_DIR%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP_DIR%\mysql\bin\my.ini" --standalone
    ) else (
        echo [WARN] mysqld.exe not found under "%XAMPP_DIR%\mysql\bin".
    )
)

:: Check if node_modules exist, if not install them silently
if not exist "node_modules\" (
    echo [INFO] First-time setup: Installing dependencies...
    call npm install --quiet
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check Node.js and npm setup.
        pause
        exit /b 1
    )
)

del "%BACKEND_LOG%" >nul 2>&1
del "%FRONTEND_LOG%" >nul 2>&1
del "%BACKEND_HELPER%" >nul 2>&1
del "%FRONTEND_HELPER%" >nul 2>&1

:: Start backend if port 8000 is not already listening
netstat -ano 2>NUL | findstr ":8000 " | findstr "LISTENING" >NUL
if errorlevel 1 (
    echo [INFO] Launching backend service...
    (
        echo @echo off
        echo cd /d "%PROJECT_ROOT%"
        echo call start-backend.bat ^> "%BACKEND_LOG%" 2^>^&1
    ) > "%BACKEND_HELPER%"
    start "PDAO Backend" /min "%BACKEND_HELPER%"
) else (
    echo [INFO] Backend already running on port 8000.
)

:: Start frontend if port 3000 is not already listening
netstat -ano 2>NUL | findstr ":3000 " | findstr "LISTENING" >NUL
if errorlevel 1 (
    echo [INFO] Launching frontend service...
    (
        echo @echo off
        echo cd /d "%PROJECT_ROOT%"
        echo npm run dev:frontend ^> "%FRONTEND_LOG%" 2^>^&1
    ) > "%FRONTEND_HELPER%"
    start "PDAO Frontend" /min "%FRONTEND_HELPER%"
) else (
    echo [INFO] Frontend already running on port 3000.
)

echo [INFO] Waiting for backend connection...
call :WAIT_FOR_PORT 8000 60
if errorlevel 1 (
    echo [ERROR] Backend did not start on port 8000 within timeout.
    if exist "%BACKEND_LOG%" (
        echo [INFO] Opening backend log...
        start "Backend Log" notepad "%BACKEND_LOG%"
    )
    pause
    exit /b 1
)

echo [INFO] Waiting for frontend connection...
call :WAIT_FOR_PORT 3000 90
if errorlevel 1 (
    echo [WARN] Frontend did not start on port 3000 in time.
    if exist "%FRONTEND_LOG%" (
        echo [INFO] Opening frontend log...
        start "Frontend Log" notepad "%FRONTEND_LOG%"
    )
    echo [INFO] Attempting to open browser anyway...
)

echo [SUCCESS] Connected! Opening website...

:: Automatically open the website
start "" "http://localhost:3000"

del "%BACKEND_HELPER%" >nul 2>&1
del "%FRONTEND_HELPER%" >nul 2>&1

:: Exit the terminal automatically
exit

:TRY_PROJECT_ROOT
set "CANDIDATE=%~1"
if exist "%CANDIDATE%package.json" (
    if exist "%CANDIDATE%server\artisan" (
        set "PROJECT_ROOT=%CANDIDATE%"
    )
)
exit /b 0

:WAIT_FOR_PORT
set "WAIT_PORT=%~1"
set "WAIT_MAX=%~2"
set /a WAIT_TRY=0

:WAIT_FOR_PORT_LOOP
set /a WAIT_TRY=%WAIT_TRY%+1
netstat -ano 2>NUL | findstr ":%WAIT_PORT% " | findstr "LISTENING" >NUL
if not errorlevel 1 exit /b 0
if %WAIT_TRY% GEQ %WAIT_MAX% exit /b 1
timeout /t 1 /nobreak >nul
goto WAIT_FOR_PORT_LOOP
