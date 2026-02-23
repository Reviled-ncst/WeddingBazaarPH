'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_role: string;
  display_name: string;
  vendor_category?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  receiver_name: string;
}

interface MessagesTabProps {
  userId: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

export function MessagesTab({ userId }: MessagesTabProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversations();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.other_user_id);
      // Poll for new messages every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.other_user_id);
      }, 5000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/messages/conversations.php?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/messages/list.php?user_id=${userId}&other_user_id=${otherUserId}`
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
        // Update unread count in conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.other_user_id === otherUserId ? { ...c, unread_count: 0 } : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/messages/send.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedConversation.other_user_id,
          content: newMessage.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations(); // Update last message in list
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-PH', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  // Mobile view - show either list or conversation
  if (selectedConversation) {
    return (
      <Card className="h-[500px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-dark-700">
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-gray-400 hover:text-white md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">{selectedConversation.display_name}</h4>
            {selectedConversation.vendor_category && (
              <p className="text-xs text-gray-400 capitalize">{selectedConversation.vendor_category}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isMine = message.sender_id === userId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMine
                        ? 'bg-pink-500 text-white rounded-br-md'
                        : 'bg-dark-700 text-white rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-pink-200' : 'text-gray-400'}`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} className="rounded-full px-4">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // Conversations list
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Messages</h3>
      {conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card
              key={conversation.other_user_id}
              className="p-4 cursor-pointer hover:border-pink-500/30 transition-colors"
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-pink-400" />
                  </div>
                  {conversation.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium truncate">{conversation.display_name}</h4>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.last_message_time)}
                    </span>
                  </div>
                  {conversation.vendor_category && (
                    <p className="text-xs text-pink-400 capitalize">{conversation.vendor_category}</p>
                  )}
                  <p className="text-sm text-gray-400 truncate">{conversation.last_message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm mt-2">Messages will appear here when you start a conversation</p>
          </div>
        </Card>
      )}
    </div>
  );
}
