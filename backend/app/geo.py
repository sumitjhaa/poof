import httpx


class GeoResolver:
    def __init__(self):
        self._cache: dict[str, str] = {}
        self._timeout = 2.0

    async def resolve(self, ip: str) -> str | None:
        if not ip or ip in ("127.0.0.1", "::1", "localhost"):
            return None

        if ip in self._cache:
            return self._cache[ip]

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city")
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "success":
                        parts = [p for p in (data.get("city"), data.get("regionName"), data.get("country")) if p]
                        location = ", ".join(parts) if parts else None
                        self._cache[ip] = location
                        return location
        except Exception:
            pass

        self._cache[ip] = None
        return None

    def resolve_sync(self, ip: str) -> str | None:
        if not ip or ip in ("127.0.0.1", "::1", "localhost"):
            return None

        if ip in self._cache:
            return self._cache[ip]

        try:
            resp = httpx.get(
                f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city",
                timeout=self._timeout,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    parts = [p for p in (data.get("city"), data.get("regionName"), data.get("country")) if p]
                    location = ", ".join(parts) if parts else None
                    self._cache[ip] = location
                    return location
        except Exception:
            pass

        self._cache[ip] = None
        return None

    def clear(self):
        self._cache.clear()


geo = GeoResolver()
