"""S3 upload helper for qr-svc."""
import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError


_BUCKET = os.getenv("S3_BUCKET_QR_CODES", "urlshortner-qr-codes")
_REGION = os.getenv("AWS_REGION", "us-east-1")
_CLOUDFRONT = os.getenv("CLOUDFRONT_DOMAIN", "")


def _s3_client():
    return boto3.client(
        "s3",
        region_name=_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


async def upload_to_s3(data: bytes, key: str, content_type: str = "image/png") -> str:
    """
    Upload *data* to S3 under *key* and return the public URL.
    If CLOUDFRONT_DOMAIN is set, returns https://<cloudfront>/<key>.
    Otherwise returns the direct S3 URL.
    """
    client = _s3_client()
    try:
        client.put_object(
            Bucket=_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
            ACL="public-read",
        )
    except (BotoCoreError, ClientError) as exc:
        raise RuntimeError(f"S3 put_object failed: {exc}") from exc

    if _CLOUDFRONT:
        return f"{_CLOUDFRONT.rstrip('/')}/{key}"
    return f"https://{_BUCKET}.s3.{_REGION}.amazonaws.com/{key}"
