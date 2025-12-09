@echo off
title Iniciando sistema de inventario

:: Iniciar backend
start cmd /k "cd C:\Users\VICTUS\Desktop\Sistema de inventario\jabon-system\frontend && npm run dev && pause"

:: Esperar 2 segundos
timeout /t 2 >nul

:: Iniciar frontend
start cmd /k "cd C:\Users\VICTUS\Desktop\Sistema de inventario\jabon-system\backend && npm run dev && pause"

