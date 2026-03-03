"""QR code generation routes."""
import hashlib
import io
import os

import qrcode
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.s3 import upload_to_s3

router = APIRouter()


class QRRequest(BaseModel):
    url: str
    short_code: str
    size: int = 10       # box size
    border: int = 4      # quiet zone


class QRResponse(BaseModel):
    short_code: str
    qr_url: str
    url: str


@router.post("/qr", response_model=QRResponse)
async def generate_qr(request: QRRequest):
    """
    Generate a QR code PNG for the given URL, upload it to S3,
    and return the CDN or S3 URL.
    """
    if not request.url:
        raise HTTPException(status_code=422, detail="url is required")

    # Generate QR code image in-memory
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=request.size,
        border=request.border,
    )
    qr.add_data(request.url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    # Consistent, deterministic S3 key derived from the short code
    s3_key = f"qr/{request.short_code}.png"
    try:
        cdn_url = await upload_to_s3(buf.getvalue(), s3_key, content_type="image/png")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {exc}") from exc

    return QRResponse(short_code=request.short_code, qr_url=cdn_url, url=request.url)
