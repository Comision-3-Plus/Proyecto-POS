@echo off
REM Script para iniciar el servidor FastAPI
cd /d "c:\Users\juani\Desktop\Proyecto-POS\core-api"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
