"""qr-svc: QR code generation service.

Generates a QR code PNG for any URL, uploads it to S3, and returns the CDN URL.
"""
import io
import os

import qrcode
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.qr import router as qr_router

load_dotenv()

app = FastAPI(
    title="QR Service",
    description="Generates and stores QR codes for short URLs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(qr_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "qr-svc"}
