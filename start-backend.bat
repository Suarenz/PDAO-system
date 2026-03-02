@echo off
cd /d "%~dp0server"
"C:\xampp\php\php.exe" artisan serve --host=127.0.0.1 --port=8000
