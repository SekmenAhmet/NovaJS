import { Request } from "express";
import { userType } from "../models/user.model";

declare global {
    namespace Express {
        interface Request {
            user: userType
        }
    }
}