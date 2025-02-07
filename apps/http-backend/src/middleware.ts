import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"

interface AuthenticatedRequest extends Request {
    userId?: string
}

export const userMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];

    const decoded = jwt.verify(header as string, process.env.JWT_SECRET!) as JwtPayload;

    if(decoded) {
        req.userId = String(decoded.userId);
        next();
    } else {
        res.status(403).json({
            message: "Unauthorized: Invalid token."
        })
    }
}

export default AuthenticatedRequest;