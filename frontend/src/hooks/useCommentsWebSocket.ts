import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

interface CommentUpdate {
  templateId: number;
  comments: any[];
  requestingUser?: {
    userId: string;
    isAdmin: boolean;
  };
}

export function useCommentsWebSocket(templateId: number) {
  const { getToken, userId } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [requestingUser, setRequestingUser] = useState<{
    userId: string;
    isAdmin: boolean;
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!templateId) return;

    console.log("Attempting WebSocket connection for templateId:", templateId);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // const host = window.location.host;
    const host = "localhost:3000"; // Replace with your server's host and port
    let wsUrl = `${protocol}//${host}/comments?templateId=${templateId}`;

    console.log("WebSocket URL:", wsUrl);

    if (userId) {
      getToken().then((token) => {
        wsUrl += `&token=${token}`;
        connectWebSocket(wsUrl);
      });
    } else {
      connectWebSocket(wsUrl);
    }

    function connectWebSocket(url: string) {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        const data: CommentUpdate = JSON.parse(event.data);
        if (data.templateId === templateId) {
          setComments(data.comments);
          if (data.requestingUser) {
            setRequestingUser(data.requestingUser);
          }
        }
      };

      socket.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        //  Add reconnect logic here
        // Try to reconnect
        setTimeout(() => {
          console.log("Reconnecting WebSocket...");
          connectWebSocket(url);
        }, 100); // Reconnect after 1 mili second
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      return () => {
        socket.close();
      };
    }
  }, [templateId, userId]);

  return { comments, requestingUser, isConnected };
}
