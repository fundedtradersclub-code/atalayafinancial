@echo off
title ATALAYA
cd /d "%~dp0"
echo Iniciando ATALAYA en http://localhost:3210 ...
start "" http://localhost:3210
npx next dev -p 3210
