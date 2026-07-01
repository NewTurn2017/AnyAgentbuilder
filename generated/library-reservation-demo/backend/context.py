from collections.abc import Mapping

from models import InternalContextModel, JsonValue, PublicContextModel

PUBLIC_FIELD_NAMES = [
  "patron_display_name",
  "reservation_id",
  "resource_label",
  "time_window",
  "reservation_status",
  "loan_titles",
  "policy_summary",
]
INTERNAL_FIELD_NAMES = [
  "member_id",
  "internal_notes",
  "policy_overrides",
  "raw_hold_queue",
  "staff_token",
  "inventory_cost",
]


def only_fields(seed: Mapping[str, JsonValue], fields: list[str]) -> dict[str, JsonValue]:
    return {key: seed[key] for key in fields if key in seed}


def build_public_context(seed: Mapping[str, JsonValue]) -> PublicContextModel:
    return PublicContextModel.model_validate(only_fields(seed, PUBLIC_FIELD_NAMES))


def build_internal_context(seed: Mapping[str, JsonValue]) -> InternalContextModel:
    return InternalContextModel.model_validate(only_fields(seed, INTERNAL_FIELD_NAMES))
