import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SigninSchema,
} from "@repo/common/types";
import { middleware } from "./middleware";
import { prismaClient } from "@repo/db";

const app = express();
const PORT = 3001;
const SALT_ROUNDS = 10;

app.use(express.json());

app.post("/signup", async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: result.error,
    });
  }

  const { username, password, name } = result.data;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const existingUser = await prismaClient.user.findFirst({
    where: {
      email: username,
    },
  });
  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const createdUser = await prismaClient.user.create({
    data: {
      email: username,
      password: hashedPassword,
      name,
      photo: "",
    },
  });

  const token = jwt.sign({ userId: createdUser.id }, JWT_SECRET);

  res.json({
    message: "Signup successful",
    token,
  });
});

app.post("/signin", async (req, res) => {
  const result = SigninSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: result.error,
    });
  }

  const { username, password } = result.data;

  const user = await prismaClient.user.findFirst({
    where: {
      email: username,
    },
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET);

  res.json({
    message: "Signin successful",
    token,
  });
});
app.post("/room", middleware, async (req, res) => {
  const result = CreateRoomSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: result.error,
    });
  }

  //@ts-ignore
  const userId = req.userId;

  const room = await prismaClient.room.create({
    data: {
      slug: result.data.name,
      adminId: userId,
    },
  });

  return res.status(201).json({
    message: "Room created",
    room: result.data,
    roomId: room.id,
  });
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);

  if (Number.isNaN(roomId)) {
    return res.status(400).json({
      message: "Invalid room id",
    });
  }

  const messages = await prismaClient.chat.findMany({
    where: {
      roomId,
    },
    orderBy: {
      id: "desc",
    },
    take: 50,
  });

  return res.json({
    messages: messages.reverse(),
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
