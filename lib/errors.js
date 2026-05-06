export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.code = "VALIDATION";
    this.status = 400;
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resursă inexistentă") {
    super(message);
    this.code = "NOT_FOUND";
    this.status = 404;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Neautorizat") {
    super(message);
    this.code = "UNAUTHORIZED";
    this.status = 401;
  }
}
