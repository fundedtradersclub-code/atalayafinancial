@echo off
title ATALAYA - puente MetaTrader 5
cd /d "%~dp0"
echo Puente MetaTrader 5 para ATALAYA (solo lectura)
echo Abre MetaTrader 5 con tu cuenta (demo) antes de continuar.
echo.
python -c "import MetaTrader5" 2>nul || (echo Instalando el paquete oficial MetaTrader5... & python -m pip install --user MetaTrader5)
python connectors\mt5_bridge.py
pause
