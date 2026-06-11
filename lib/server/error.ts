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

export const ErrorResponses = {
    Unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),

    NotFound: (element: string) => NextResponse.json({ error: `${element} does not exist` }, { status: 400 }),

    BadRequest: NextResponse.json({ error: "Bad Request" }, { status: 400 }),

    Forbidden: NextResponse.json({ error: "forbidden" }, { status: 403 }),



}