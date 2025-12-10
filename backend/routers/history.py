from datetime import datetime
from enum import Enum
from typing import List, Optional

from backend.database import get_session
from backend.models import ProcessedEmail, ProcessingRun
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, and_, func, select

router = APIRouter(prefix="/api/history", tags=["history"])

# Constants
RUN_GROUPING_WINDOW_SECONDS = (
    300  # 5 minutes - emails within this window are grouped into same run
)


# Valid status values
class EmailStatus(str, Enum):
    FORWARDED = "forwarded"
    BLOCKED = "blocked"
    IGNORED = "ignored"
    ERROR = "error"


def parse_iso_date(date_str: str) -> datetime:
    """Parse ISO date string, handling Z timezone notation

    Args:
        date_str: ISO 8601 formatted date string (non-empty)

    Returns:
        datetime object

    Raises:
        HTTPException: If date format is invalid
    """
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: {date_str}. Expected ISO 8601 format (e.g., 2025-12-10T10:00:00Z)",
        )


@router.get("/emails")
def get_email_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    status: Optional[EmailStatus] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """Get paginated email history with optional filtering"""

    # Build query
    query = select(ProcessedEmail)

    # Apply filters
    filters = []
    if status:
        filters.append(ProcessedEmail.status == status.value)
    if date_from and date_from.strip():
        date_from_obj = parse_iso_date(date_from)
        filters.append(ProcessedEmail.processed_at >= date_from_obj)
    if date_to and date_to.strip():
        date_to_obj = parse_iso_date(date_to)
        filters.append(ProcessedEmail.processed_at <= date_to_obj)

    if filters:
        query = query.where(and_(*filters))

    # Order by processed_at descending
    query = query.order_by(ProcessedEmail.processed_at.desc())

    # Get total count
    count_query = select(func.count()).select_from(ProcessedEmail)
    if filters:
        count_query = count_query.where(and_(*filters))
    total = session.exec(count_query).one()

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    emails = session.exec(query).all()

    return {
        "emails": emails,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page,
        },
    }


@router.get("/stats")
def get_history_stats(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """Get statistics for email processing history"""

    # Build base query
    query = select(ProcessedEmail)

    # Apply date filters
    filters = []
    if date_from and date_from.strip():
        date_from_obj = parse_iso_date(date_from)
        filters.append(ProcessedEmail.processed_at >= date_from_obj)
    if date_to and date_to.strip():
        date_to_obj = parse_iso_date(date_to)
        filters.append(ProcessedEmail.processed_at <= date_to_obj)

    if filters:
        query = query.where(and_(*filters))

    emails = session.exec(query).all()

    # Calculate stats
    total = len(emails)
    forwarded = sum(1 for e in emails if e.status == "forwarded")
    blocked = sum(1 for e in emails if e.status == "blocked" or e.status == "ignored")
    errors = sum(1 for e in emails if e.status == "error")

    # Calculate total amount
    total_amount = sum(e.amount for e in emails if e.amount)

    # Group by status
    status_breakdown = {}
    for email in emails:
        status = email.status
        status_breakdown[status] = status_breakdown.get(status, 0) + 1

    return {
        "total": total,
        "forwarded": forwarded,
        "blocked": blocked,
        "errors": errors,
        "total_amount": total_amount,
        "status_breakdown": status_breakdown,
    }


@router.get("/runs")
def get_recent_runs(
    limit: int = Query(20, ge=1, le=100), session: Session = Depends(get_session)
):
    """Get aggregated information about recent processing runs"""
    # Query the actual ProcessingRun table
    query = select(ProcessingRun).order_by(ProcessingRun.started_at.desc()).limit(limit)
    runs_db = session.exec(query).all()

    runs = []
    for r in runs_db:
        # Map ProcessingRun to the format expected by frontend
        # Front end expects:
        # run_time, first_processed, last_processed, total_emails, forwarded, blocked, errors, email_ids

        # approximate "blocked" as processed - forwarded (since we don't store blocked count explicitly in run yet)
        # Actually in scheduler.py: run.emails_processed = count of new emails
        # run.emails_forwarded = count of forwarded
        # blocked = processed - forwarded

        blocked = max(0, r.emails_processed - r.emails_forwarded)

        runs.append(
            {
                "run_time": r.started_at,
                "first_processed": r.started_at,  # Simplified
                "last_processed": r.completed_at or r.started_at,
                "total_emails": r.emails_checked,  # Use checked as total seen
                "forwarded": r.emails_forwarded,
                "blocked": blocked,
                "errors": 1 if r.status == "error" else 0,
                "email_ids": [],  # Frontend doesn't use this currently
            }
        )

    return {"runs": runs}


@router.get("/processing-runs", response_model=List[ProcessingRun])
def get_processing_runs(
    limit: int = 50, skip: int = 0, session: Session = Depends(get_session)
):
    """Get processing run history with pagination"""
    statement = (
        select(ProcessingRun)
        .order_by(ProcessingRun.started_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


@router.get("/processing-runs/{run_id}", response_model=ProcessingRun)
def get_processing_run(run_id: int, session: Session = Depends(get_session)):
    """Get a specific processing run by ID"""
    run = session.get(ProcessingRun, run_id)
    if not run:
        raise HTTPException(
            status_code=404, detail=f"Processing run {run_id} not found"
        )
    return run
