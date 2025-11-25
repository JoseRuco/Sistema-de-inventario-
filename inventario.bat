@echo off
title Iniciando sistema de inventario

:: Iniciar backend
start cmd /k "cd C:\Users\VICTUS\Desktop\Sistema de inventario\jabon-system\frontend && npm run dev && pause"

:: Esperar 2 segundos
timeout /t 2 >nul

:: Iniciar frontend
start cmd /k "cd C:\Users\VICTUS\Desktop\Sistema de inventario\jabon-system\backend && npm run dev && pause"

:: Esperar 2 segundos antes de abrir el navegador
timeout /t 1 >nul

:: Abrir Opera GX en modo pantalla completa
start "" "C:\Users\VICTUS\AppData\Local\Programs\Opera GX\opera.exe" --start-fullscreen http://localhost:5173
