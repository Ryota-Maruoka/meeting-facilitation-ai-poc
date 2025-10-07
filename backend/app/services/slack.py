import httpx


def post_to_slack(webhook_url: str, text: str) -> bool:
    try:
        payload = {"text": text}
        resp = httpx.post(webhook_url, json=payload, timeout=10)
        return 200 <= resp.status_code < 300
    except Exception:
        return False
