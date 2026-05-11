"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
export function ChatRoomClient({
    messages,
    id
}: {
    messages: { message: string }[];
    id: string;
}) {
    const { socket, loading } = useSocket();
    const [chats, setChats] = useState(messages);
    const [currentMessage, setCurrentMessage] = useState("");
    useEffect(() => {
        if (socket && !loading) {
            socket.send(
                JSON.stringify({
                    type: "join_room",
                    roomId: id
                })
            );
            socket.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data);
                    console.log(parsedData);
                    if (parsedData.type === "chat") {
                        setChats((c) => [
                            ...c,
                            {
                                message: parsedData.message
                            }
                        ]);
                    }
                    if (parsedData.type === "error") {
                        console.log(parsedData.message);
                    }
                } catch (err) {
                    console.log("Invalid websocket message");
                }
            };
        }
    }, [socket, loading, id]);
    return (
        <div>
            {chats.map((m, index) => (
                <div key={index}>
                    {m.message}
                </div>
            ))}
            <input
                type="text"
                value={currentMessage}
                onChange={(e) => {
                    setCurrentMessage(e.target.value);
                }}
            />
            <button
                onClick={() => {
                    if (
                        !socket ||
                        socket.readyState !== WebSocket.OPEN
                    ){
                        console.log("socket not connected");
                        return;
                    }
                    socket.send(
                        JSON.stringify({
                            type: "chat",
                            roomId: id,
                            message: currentMessage
                        })
                    );
                    setCurrentMessage("");
                }}
            >
                Send message
            </button>
        </div>
    );
}