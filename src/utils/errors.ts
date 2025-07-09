export abstract class BaseError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly name: string;

    constructor(name: string,message: string, statusCode: number, isOperational: boolean = true) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = name;

        //Capture the stack trace, excluding the constructor call
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    public toJSON() {
        return {
            success: false,
            error: this.name,
            message: this.message,
            statusCode: this.statusCode,
            isOperational: this.isOperational,
        }
    }

    public sendResponse(res: any) {
        res.status(this.statusCode).json(this.toJSON());
    }
}

//Client and other object related errors (4xx)
export class ItemNotFoundError extends BaseError {
    constructor(message: string = "Item not found") {
        super("ItemNotFound", message, 404);
    }
}

export class ValidationError extends BaseError {
    constructor(message: string = "Validation failed") {
        super("ValidationError", message, 400);
    }
}

export class AuthenticationError extends BaseError {
    constructor(message: string = "Authentication failed") {
        super("AuthenticationError", message, 401);
    }
}

export class ConflictError extends BaseError {
    constructor(message: string = "Conflict occurred") {
        super("ConflictError", message, 409);
    }
}

export class RateLimitError extends BaseError {
    constructor(message: string = "Rate limit exceeded") {
        super("RateLimitError", message, 429);
    }
}

//Server errors (5xx)
export class DatabaseError extends BaseError {
    constructor(message: string = "Database error") {
        super("DatabaseError", message, 500, false);
    }
}

export class ExternalServiceError extends BaseError {
    constructor(message: string = "External service error") {
        super("ExternalServiceError", message, 502);
    }
}

export const isOperationalError = (error: Error): boolean => {
    if (error instanceof BaseError) {
        return error.isOperational;
    }
    return false;
};
