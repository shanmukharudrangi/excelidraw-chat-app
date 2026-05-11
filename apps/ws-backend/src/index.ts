import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db";
const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") return null;
    if (!decoded?.userId) return null;

    return decoded.userId;
  } catch {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;

  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = (queryParams.get("token") || "").trim();

  if (!token) {
    ws.send(JSON.stringify({type:"error",message:"Token missing"}));
    ws.close(1008, "Token missing");
    return;
  }

  const userId = checkUser(token);

  if (!userId) {
    ws.send(JSON.stringify({type:"error",message:"Invalid token"}));
    ws.close(1008, "Invalid token");
    return;
  }

  const user: User = {
    userId,
    rooms: [],
    ws,
  };

  users.push(user);

  console.log("User connected:", userId);

  ws.send(JSON.stringify({type:"system",message:"Connected successfully"}));

  ws.on("message",async function message(data) {
    try {
      const parsedData = JSON.parse(data.toString());

      // JOIN ROOM
      if (parsedData.type === "join_room") {
        const user = users.find((x) => x.ws === ws);
        if (!user) return;

        if (!user.rooms.includes(parsedData.roomId)) {
          user.rooms.push(parsedData.roomId);
        }
      }

      // LEAVE ROOM
      if (parsedData.type === "leave_room") {
        const user = users.find((x) => x.ws === ws);
        if (!user) return;

        user.rooms = user.rooms.filter(
          (roomId) => roomId !== parsedData.roomId
        );
      }

      // CHAT MESSAGE
      if (parsedData.type === "chat") {
        const roomId = Number(parsedData.roomId);
        const message = parsedData.message;
        await prismaClient.chat.create({
          data:{
            roomId,
            message,
            userId
          }
        });
        users.forEach((user) => {
          if (user.rooms.includes(parsedData.roomId)) {
            user.ws.send(
              JSON.stringify({
                type: "chat",
                message,
                roomId,
              })
            );
          }
        });
      }
    } catch (err) {
      console.error("Invalid message received:", err);
      ws.send(JSON.stringify({type:"error",message:"Invalid message format"}));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    // REMOVE USER ON DISCONNECT (important fix)
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });
});

console.log("WebSocket server running on port 8080");
