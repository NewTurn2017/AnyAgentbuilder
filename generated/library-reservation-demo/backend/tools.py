from models import JsonObject, PublicContextModel


def availability_tool(resources: list[JsonObject]) -> list[JsonObject]:
    available = [resource for resource in resources if resource.get("status") in {"available", "held", "waitlisted"}]
    return available


def reservation_tool(public_context: PublicContextModel, status: str) -> PublicContextModel:
    updates = {"reservation_status": status} if "reservation_status" in type(public_context).model_fields else {}
    return public_context.model_copy(update=updates)


def policy_tool(summary: str) -> JsonObject:
    return {"policy_summary": summary, "decision": "allow_mock_reservation"}
