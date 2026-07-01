export class HarnessError extends Error {
  constructor(message, status = "failed", details = {}) {
    super(message);
    this.status = status;
    Object.assign(this, details);
  }
}
