@echo off
cd /d "%~dp0server"
"D:\downloads\Downloads from web\xampp\php\php.exe" artisan serve --host=127.0.0.1 --port=8000
