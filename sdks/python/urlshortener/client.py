"""
URL Shortener – Official Python SDK
"""

import requests


class URLShortenerClient:
    """
    Client for the URL Shortener REST API.

    Example::

        from urlshortener import URLShortenerClient

        client = URLShortenerClient(base_url="https://api.urlshortner.example.com", api_key="sk-xxx")
        link = client.links.create(long_url="https://example.com")
        print(link["short_url"])
    """

    def __init__(self, base_url: str = "http://localhost:8081", api_key: str = "", jwt_token: str = ""):
        self._session = requests.Session()
        self._base = base_url.rstrip("/") + "/api/v1"
        if api_key:
            self._session.headers["X-API-Key"] = api_key
        if jwt_token:
            self._session.headers["Authorization"] = f"Bearer {jwt_token}"
        self._session.headers["Content-Type"] = "application/json"

        self.links = _LinksResource(self)
        self.analytics = _AnalyticsResource(self)
        self.orgs = _OrgsResource(self)
        self.users = _UsersResource(self)

    def _get(self, path: str, **params):
        r = self._session.get(f"{self._base}{path}", params=params)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, body=None):
        r = self._session.post(f"{self._base}{path}", json=body)
        r.raise_for_status()
        return r.json()

    def _delete(self, path: str):
        r = self._session.delete(f"{self._base}{path}")
        r.raise_for_status()
        return r.status_code


class _LinksResource:
    def __init__(self, client: URLShortenerClient):
        self._c = client

    def create(self, long_url: str, alias: str = None, expires_at: str = None, org_id: str = None, **kwargs):
        payload = {"long_url": long_url, **kwargs}
        if alias:
            payload["alias"] = alias
        if expires_at:
            payload["expires_at"] = expires_at
        if org_id:
            payload["org_id"] = org_id
        return self._c._post("/links", payload)

    def list(self, org_id: str = None, page: int = 1, page_size: int = 20):
        return self._c._get("/links", org_id=org_id, page=page, page_size=page_size)

    def bulk_create(self, items: list):
        return self._c._post("/links/bulk", items)

    def delete(self, link_id: str):
        return self._c._delete(f"/links/{link_id}")

    def generate_qr(self, short_code: str, size: int = 10, border: int = 4):
        return self._c._post(f"/links/{short_code}/qr", {"size": size, "border": border})


class _AnalyticsResource:
    def __init__(self, client: URLShortenerClient):
        self._c = client

    def summary(self, short_code: str):
        return self._c._get(f"/analytics/{short_code}/summary")

    def timeseries(self, short_code: str, granularity: str = "day", from_: str = None, to: str = None):
        return self._c._get(f"/analytics/{short_code}/timeseries",
                            granularity=granularity, **({} if from_ is None else {"from": from_}),
                            **({} if to is None else {"to": to}))


class _OrgsResource:
    def __init__(self, client: URLShortenerClient):
        self._c = client

    def create(self, name: str, plan: str = "free", owner_id: str = None):
        return self._c._post("/orgs", {"name": name, "plan": plan, "ownerId": owner_id})

    def get(self, org_id: str):
        return self._c._get(f"/orgs/{org_id}")

    def list(self, page: int = 1, page_size: int = 20):
        return self._c._get("/orgs", page=page, page_size=page_size)

    def delete(self, org_id: str):
        return self._c._delete(f"/orgs/{org_id}")

    def members(self, org_id: str):
        return self._c._get(f"/orgs/{org_id}/members")


class _UsersResource:
    def __init__(self, client: URLShortenerClient):
        self._c = client

    def create(self, email: str, password: str, name: str = None, org_id: str = None, role: str = "member"):
        return self._c._post("/users", {"email": email, "password": password, "name": name,
                                         "orgId": org_id, "role": role})

    def get(self, user_id: str):
        return self._c._get(f"/users/{user_id}")

    def list(self, org_id: str = None, page: int = 1, page_size: int = 20):
        return self._c._get("/users", org_id=org_id, page=page, page_size=page_size)

    def delete(self, user_id: str):
        return self._c._delete(f"/users/{user_id}")
