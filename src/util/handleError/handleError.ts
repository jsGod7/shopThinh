import { HttpException, HttpStatus } from "@nestjs/common";

export class ForbiddenException extends HttpException {
    constructor(){
        super('FORBIDDEN',HttpStatus.FORBIDDEN)
    }
}

export class BadRequest extends HttpException {
    constructor(){
        super('Bad request',HttpStatus.BAD_REQUEST)
    }
}
export class NotFound extends HttpException {
    constructor(){
        super('Not Found',HttpStatus.NOT_FOUND)
    }
}

export class ServerError extends HttpException {
    constructor(){
        super('Server error',HttpStatus.INTERNAL_SERVER_ERROR)
    }
}

export class Unauthorize extends HttpException {
    constructor(){
        super('Unauthorize',HttpStatus.UNAUTHORIZED)
    }
}
export class Response extends HttpException {
    constructor(){
        super('OK',HttpStatus.OK)
    }
}

