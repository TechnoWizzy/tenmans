import {HttpStatusCode} from "axios";

export class ExceptionMapper {
    public getCode(err: unknown) {
        return HttpStatusCode.InternalServerError;
    }

    public getMessage(err: unknown) {
        return "Unknown error";
    }
}