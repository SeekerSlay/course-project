@echo off
chcp 65001 > nul
echo Запуск интернет-магазина VeganShop...

:: 1. Запуск Backend через Daphne
start "Backend - Daphne" cmd /k "cd backend && call venv\Scripts\activate && daphne -b 127.0.0.1 -p 8000 config.asgi:application"

:: 2. Запуск Frontend через npm
start "Frontend - React" cmd /k "cd frontend && npm start"

echo Всё запущенно! Эти два окна терминала закрывать нельзя.