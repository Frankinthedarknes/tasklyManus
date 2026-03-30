import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageCircle } from "lucide-react";
import AppLayout from "./AppLayout";
import { toast } from "sonner";

const QUICK_MESSAGES = [
  "Estoy disponible",
  "Voy en camino",
  "¿Puedes pagar X?",
  "¿Cuándo podemos hacerlo?",
  "Listo, completado",
];

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);

  const sendMessage = trpc.chat.sendMessage.useMutation();
  const { data: messages } = trpc.chat.getMessages.useQuery(
    selectedConversation
      ? { conversationId: selectedConversation, limit: 50 }
      : { conversationId: 0, limit: 50 },
    { enabled: !!selectedConversation }
  );

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversation,
        content,
        isQuickMessage: QUICK_MESSAGES.includes(content),
      });
      setMessageText("");
      toast.success("Mensaje enviado");
    } catch (error) {
      toast.error("Error al enviar el mensaje");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto h-[600px] flex gap-6">
        {/* Conversations List */}
        <div className="w-64 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white mb-4">Conversaciones</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {conversations.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
                <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">
                  No hay conversaciones aún
                </p>
              </Card>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-3 rounded-lg text-left transition ${
                    selectedConversation === conv.id
                      ? "bg-blue-600"
                      : "bg-slate-800/50 hover:bg-slate-800"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    {conv.otherUserName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {conv.lastMessage}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-slate-900/50 rounded-lg p-4">
                {messages && messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === 1 ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === 1
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-100"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Inicia la conversación</p>
                  </div>
                )}
              </div>

              {/* Quick Messages */}
              <div className="mb-4 flex gap-2 flex-wrap">
                {QUICK_MESSAGES.map((msg) => (
                  <Button
                    key={msg}
                    onClick={() => handleSendMessage(msg)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    {msg}
                  </Button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage(messageText);
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <Button
                  onClick={() => handleSendMessage(messageText)}
                  disabled={sendMessage.isPending || !messageText.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Selecciona una conversación para empezar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
