"""
Servidor minimo para debugging
"""
from fastapi import FastAPI
import logging
import uvicorn
import asyncio

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "ok"}

@app.on_event("startup")
async def startup():
    logger.info("STARTUP EVENT")

@app.on_event("shutdown")
async def shutdown():
    logger.info("SHUTDOWN EVENT")
    import traceback
    logger.error("Stack trace en shutdown:")
    traceback.print_stack()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
