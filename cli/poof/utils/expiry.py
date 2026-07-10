def parse_expiry(value: str) -> int:
    """Parse human-readable expiry to seconds."""
    units = {"m": 60, "h": 3600, "d": 86400}
    if value[-1] in units:
        return int(value[:-1]) * units[value[-1]]
    return int(value)
