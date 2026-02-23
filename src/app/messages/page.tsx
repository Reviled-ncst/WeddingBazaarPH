'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Send, MessageSquare, User, Clock, Loader2
} from 'lucide-react';
import { Button, Card } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface Conversation {
  user_id: number;
  user_name: string;
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
}

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get('vendor');
  
  const [userId, setUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'couple') {
          setUserId(user.id);
          fetchConversations(user.id);
        } else {
          router.push('/login');
        }
      } catch (e) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (vendorParam && conversations.length > 0) {
      const vendorId = parseInt(vendorParam);
      const conv = conversations.find(c => c.user_id === vendorId);
      if (conv) {
        selectConversation(conv);
      }
    }
  }, [vendorParam, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations.php?user_id=${id}`);
      const result = await response.json();
      if (result.success) {
        setConversations(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: number) => {
    if (!userId) return;
    
    try {
      const response = await fetch(
        `${API_URL}/messages/list.php?user_id=${userId}&other_user_id=${otherUserId}`
      );
      const result = await response.json();
      if (result.success) {
        setMessages(result.data);
        // Update unread count in conversations
        setConversations(prev => prev.map(c => 
          c.user_id === otherUserId ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.user_id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/messages/send.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedConversation.user_id,
          content: newMessage.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessages([...messages, {
          id: result.data.id,
          sender_id: userId,
          receiver_id: selectedConversation.user_id,
          content: newMessage.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        }]);
        setNewMessage('');
        
        // Update conversation's last message
        setConversations(prev => prev.map(c => 
          c.user_id === selectedConversation.user_id 
            ? { ...c, last_message: newMessage.trim(), last_message_time: new Date().toISOString() }
            : c
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-PH', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="bg-dark-900/50 border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/discover" className="text-gray-400 hover:text-pink-400 flex items-center gap-1 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </Link>
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 mt-1">Chat with your wedding vendors</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {conversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No messages yet</h2>
            <p className="text-gray-400 mb-6">Start a conversation by messaging a vendor.</p>
            <Link href="/discover">
              <Button>Browse Vendors</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <Card className="md:col-span-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-dark-800">
                <h2 className="font-semibold text-white">Conversations</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.user_id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-dark-800/50 transition-colors text-left ${
                      selectedConversation?.user_id === conv.user_id ? 'bg-dark-800' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-400 font-medium">
                        {conv.user_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium truncate">{conv.user_name}</h3>
                        <span className="text-gray-500 text-xs">{formatTime(conv.last_message_time)}</span>
                      </div>
                      <p className="text-gray-400 text-sm truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-pink-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Messages Area */}
            <Card className="md:col-span-2 overflow-hidden flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-dark-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                      <span className="text-pink-400 font-medium">
                        {selectedConversation.user_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{selectedConversation.user_name}</h3>
                      <Link 
                        href={`/vendors/${selectedConversation.user_id}`}
                        className="text-pink-400 text-sm hover:underline"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            msg.sender_id === userId
                              ? 'bg-pink-500 text-white rounded-br-sm'
                              : 'bg-dark-800 text-gray-200 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_id === userId ? 'text-pink-200' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-dark-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500"
                      />
                      <Button type="submit" disabled={!newMessage.trim() || sending}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
