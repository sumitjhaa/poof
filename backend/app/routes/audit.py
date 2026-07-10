from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.audit import audit_log, AuditEvent

router = APIRouter()


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

    return {
        "entries": [
            {
                "id": e.id,
                "event": e.event.value,
                "resource_id": e.resource_id,
                "resource_type": e.resource_type,
                "timestamp": e.timestamp.isoformat(),
                "metadata": e.metadata,
                "ip_address": e.ip_address,
            }
            for e in entries
        ],
        "total": len(entries),
    }


@router.get("/export")
async def export_audit_logs(
    format: str = Query(default="json", pattern="^(json|csv)$"),
    limit: int = Query(default=1000, ge=1, le=10000),
):
    if format == "json":
        data = audit_log.export_json(limit=limit)
        return JSONResponse(
            content=data,
            headers={"Content-Type": "application/json"},
        )
    else:
        # CSV export
        import csv
        import io

        entries = audit_log.export_json(limit=limit)
        if not entries:
            return JSONResponse(content=[], headers={"Content-Type": "text/csv"})

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=entries[0].keys())
        writer.writeheader()
        writer.writerows(entries)

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
