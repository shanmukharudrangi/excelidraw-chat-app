import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";
export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
        const token = localStorage.getItem("token");
        const ws = new WebSocket(
            `${WS_URL}?token=${token}`
        );
        ws.onopen = () => {
            console.log("websocket connected");
            setLoading(false);
            setSocket(ws);
        };
        ws.onclose = () => {
            console.log("websocket disconnected");
        };
        return () => {
            ws.close();
        };
    }, []);
    return {
        socket,
        loading
    };
}