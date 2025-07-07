import { io, Socket } from "socket.io-client";
// @ts-ignore
import { BACKEND_URL } from "@env";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId: string) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Socket.io bağlandı");
      this.isConnected = true;

      // Kullanıcı giriş bilgisini gönder
      this.socket?.emit("user_login", userId);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket.io bağlantısı koptu");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.io bağlantı hatası:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
    conversationId: string
  ) {
    if (this.socket && this.isConnected) {
      this.socket.emit("send_message", {
        senderId,
        receiverId,
        text,
        conversationId,
      });
    }
  }

  startTyping(senderId: string, receiverId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_start", { senderId, receiverId });
    }
  }

  stopTyping(senderId: string, receiverId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_stop", { senderId, receiverId });
    }
  }

  // Mesajları görüldü olarak işaretle
  markMessagesAsSeen(userId: string, conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("mark_messages_seen", { userId, conversationId });
    }
  }

  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  onMessageSent(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("message_sent", callback);
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  onUserStoppedTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("user_stopped_typing", callback);
    }
  }

  // Mesajların görüldüğünü dinle
  onMessagesSeen(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("messages_seen", callback);
    }
  }

  // Okunmamış mesaj sayısı güncellemesini dinle
  onUnreadCountUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("unread_count_update", callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export default new SocketService();
