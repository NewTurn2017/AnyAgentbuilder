```yaml
domain_key: library
actors:
  - patron
resources:
  - room
reservation_states:
  - draft
availability_rules:
  - one slot
policies:
  - one policy
actions:
  - hold_room
tools:
  - find_available_rooms
agents:
  - triage_agent
handoffs:
  - triage_agent -> room_reservation_agent
guardrails:
  - privacy_guardrail
public_context:
  - patron_display_name
  - reservation_id
  - resource_label
  - time_window
  - reservation_status
  - loan_titles
  - policy_summary
  - member_id
internal_context:
  - member_id
  - internal_notes
  - policy_overrides
  - raw_hold_queue
  - staff_token
  - inventory_cost
widgets:
  - room_picker
happy_path_qa:
  - ok
failure_path_qa:
  - blocked
```
