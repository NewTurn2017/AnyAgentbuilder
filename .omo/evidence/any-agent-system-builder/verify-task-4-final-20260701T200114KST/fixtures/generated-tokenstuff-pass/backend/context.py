class PublicContext:
    pass

class InternalContext:
    pass

def build_public_context():
    return {
        "public_context": True,
        "patron_display_name": "Demo",
        "reservation_id": "R-1",
        "resource_label": "Room A",
        "time_window": "09:00",
        "reservation_status": "held",
        "loan_titles": [],
        "policy_summary": "ok",
    }

def build_internal_context():
    return {
        "internal_context": True,
        "member_id": "M-1",
        "internal_notes": "hidden",
        "policy_overrides": [],
        "raw_hold_queue": [],
        "staff_token": "secret",
        "inventory_cost": 0,
    }
