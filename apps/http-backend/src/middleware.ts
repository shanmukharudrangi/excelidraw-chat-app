import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export function middleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization?.trim();
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : authHeader;

  if (!token) {
    return res.status(401).json({
      message: "Token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };
    //@ts-ignore
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
}
