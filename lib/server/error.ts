import { forbidden } from "next/navigation";
import { NextResponse } from "next/server";

export class AppError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode

    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Not found') {
        super(message, 404);
    }
}


export class ExpiredError extends AppError {
    constructor(message = 'Expired') {
        super(message, 401);
    }
}

export class RevokedError extends AppError {
    constructor(message = 'Revoked') {
        super(message, 403);
    }
}


function errorResponse(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export const ErrorResponses = {
    get Unauthorized() {
        return errorResponse("Unauthorized", 401);
    },
    NotFound: (element: string) => errorResponse(`${element} does not exist`, 400),
    get BadRequest() {
        return errorResponse("Bad Request", 400);
    },
    get Forbidden() {
        return errorResponse("Forbidden", 403);
    },
};