from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.audit import audit_log, AuditEvent
from app.geo import geo

router = APIRouter()


def _entry_to_dict(e) -> dict:
    return {
        "id": e.id,
        "event": e.event.value,
        "resource_id": e.resource_id,
        "resource_type": e.resource_type,
        "timestamp": e.timestamp.isoformat(),
        "metadata": e.metadata,
        "ip_address": e.ip_address,
        "location": None,
    }


@router.get("/")
async def list_audit_logs(
    resource_id: str | None = None,
    event: AuditEvent | None = None,
    resource_type: str | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
):
    entries = audit_log.query(
        resource_id=resource_id,
        event=event,
        resource_type=resource_type,
        limit=limit,
    )

    unique_ips = list({e.ip_address for e in entries if e.ip_address})
    ip_locations: dict[str, str | None] = {}
    for ip in unique_ips:
        ip_locations[ip] = await geo.resolve(ip)

    result = []
    for e in entries:
        d = _entry_to_dict(e)
        if e.ip_address:
            d["location"] = ip_locations.get(e.ip_address)
        result.append(d)

    return {
        "entries": result,
        "total": len(result),
    }


@router.get("/export")
async def export_audit_logs(
    format: str = Query(default="json", pattern="^(json|csv)$"),
    limit: int = Query(default=1000, ge=1, le=10000),
):
    entries = audit_log.query(limit=limit)

    unique_ips = list({e.ip_address for e in entries if e.ip_address})
    ip_locations: dict[str, str | None] = {}
    for ip in unique_ips:
        ip_locations[ip] = await geo.resolve(ip)

    data = []
    for e in entries:
        d = _entry_to_dict(e)
        if e.ip_address:
            d["location"] = ip_locations.get(e.ip_address)
        data.append(d)

    if format == "json":
        return JSONResponse(
            content=data,
            headers={"Content-Type": "application/json"},
        )
    else:
        import csv
        import io

        if not data:
            return JSONResponse(content=[], headers={"Content-Type": "text/csv"})

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

        return JSONResponse(
            content=output.getvalue(),
            headers={"Content-Type": "text/csv"},
        )


@router.get("/stats")
async def audit_stats():
    entries = audit_log.query(limit=10000)

    stats = {}
    for entry in entries:
        event = entry.event.value
        stats[event] = stats.get(event, 0) + 1

    return {
        "total_events": len(entries),
        "by_event": stats,
    }
