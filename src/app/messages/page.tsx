'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Send, MessageSquare, Users, Plus, Loader2, X
} from 'lucide-react';
import { Button, Card } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_role: string;
  display_name: string;
  vendor_category: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface GroupConversation {
  id: number;
  name: string;
  type: string;
  is_admin: boolean;
  last_message: string;
  last_message_time: string;
  last_sender_name: string | null;
  unread_count: number;
  participant_count: number;
  participants: Array<{
    id: number;
    name: string;
    role: string;
    display_name: string;
    is_admin: boolean;
  }>;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface GroupMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_display_name: string;
  content: string;
  message_type: string;
  created_at: string;
}

type MessageTab = 'direct' | 'groups';

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get('vendor');
  
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<MessageTab>('direct');
  
  // Direct messages state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Group messages state
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
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
          fetchGroupConversations(user.id);
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
      const conv = conversations.find(c => c.other_user_id === vendorId);
      if (conv) {
        selectConversation(conv);
      }
    }
  }, [vendorParam, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, groupMessages]);

  const fetchConversations = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations.php?user_id=${id}`);
      const result = await response.json();
      if (result.success) {
        setConversations(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupConversations = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/messages/group-conversations.php?user_id=${id}`);
      const result = await response.json();
      if (result.success) {
        setGroupConversations(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch group conversations:', error);
    }
  };

  const fetchGroupMessages = async (conversationId: number) => {
    if (!userId) return;
    
    try {
      const response = await fetch(
        `${API_URL}/messages/group-list.php?conversation_id=${conversationId}&user_id=${userId}`
      );
      const result = await response.json();
      if (result.success) {
        setGroupMessages(result.data || []);
        // Update unread count
        setGroupConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Failed to fetch group messages:', error);
    }
  };

  const selectGroupConversation = (conv: GroupConversation) => {
    setSelectedGroup(conv);
    setSelectedConversation(null);
    fetchGroupMessages(conv.id);
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
          c.other_user_id === otherUserId ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSelectedGroup(null);
    fetchMessages(conv.other_user_id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    // Handle group message
    if (selectedGroup) {
      await sendGroupMessage(e);
      return;
    }

    if (!selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/messages/send.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedConversation.other_user_id,
          content: newMessage.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessages([...messages, {
          id: result.data.id,
          sender_id: userId,
          receiver_id: selectedConversation.other_user_id,
          content: newMessage.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        }]);
        setNewMessage('');
        
        // Update conversation's last message
        setConversations(prev => prev.map(c => 
          c.other_user_id === selectedConversation.other_user_id 
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

  const sendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !selectedGroup) return;

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/messages/send-group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedGroup.id,
          sender_id: userId,
          content: newMessage.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGroupMessages([...groupMessages, result.data]);
        setNewMessage('');
        
        // Update group conversation's last message
        setGroupConversations(prev => prev.map(c => 
          c.id === selectedGroup.id 
            ? { ...c, last_message: newMessage.trim(), last_message_time: new Date().toISOString() }
            : c
        ));
      }
    } catch (error) {
      console.error('Failed to send group message:', error);
    } finally {
      setSending(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !userId) return;

    // For now, create with just the current user (they can add more later)
    // In a full implementation, you'd have a participant selection UI
    try {
      const response = await fetch(`${API_URL}/messages/create-group.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          created_by: userId,
          name: newGroupName.trim(),
          participant_ids: [userId], // Creator is auto-added
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        // Refresh group conversations
        fetchGroupConversations(userId);
        setShowCreateGroup(false);
        setNewGroupName('');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
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
          <p className="text-gray-400 mt-1">Chat with your wedding vendors and coordinators</p>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'direct' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Direct Messages
              {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
                <span className="w-5 h-5 bg-white text-pink-500 rounded-full text-xs flex items-center justify-center">
                  {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'groups' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Group Chats
              {groupConversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
                <span className="w-5 h-5 bg-white text-pink-500 rounded-full text-xs flex items-center justify-center">
                  {groupConversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Direct Messages Tab */}
        {activeTab === 'direct' && (
          conversations.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No messages yet</h2>
              <p className="text-gray-400 mb-6">Start a conversation by messaging a vendor.</p>
              <Link href="/discover">
                <Button>Browse Vendors</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
              {/* Direct Conversations List */}
              <Card className="md:col-span-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-dark-800">
                  <h2 className="font-semibold text-white">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.other_user_id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-dark-800/50 transition-colors text-left ${
                        selectedConversation?.other_user_id === conv.other_user_id ? 'bg-dark-800' : ''
                      }`}
                    >
                      <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-pink-400 font-medium">
                          {conv.display_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium truncate">{conv.display_name}</h3>
                          {conv.last_message_time && (
                            <span className="text-gray-500 text-xs">{formatTime(conv.last_message_time)}</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm truncate">{conv.last_message || 'No messages yet'}</p>
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

              {/* Direct Messages Area */}
              <Card className="md:col-span-2 overflow-hidden flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-dark-800 flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                        <span className="text-pink-400 font-medium">
                          {selectedConversation.display_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{selectedConversation.display_name}</h3>
                        <Link 
                          href={`/vendors/${selectedConversation.other_user_id}`}
                          className="text-pink-400 text-sm hover:underline"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>

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
          )
        )}

        {/* Group Messages Tab */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
            {/* Group Conversations List */}
            <Card className="md:col-span-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-dark-800 flex items-center justify-between">
                <h2 className="font-semibold text-white">Group Chats</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {groupConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No group chats yet</p>
                    <p className="text-xs mt-1">Create one to start collaborating</p>
                  </div>
                ) : (
                  groupConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectGroupConversation(conv)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-dark-800/50 transition-colors text-left ${
                        selectedGroup?.id === conv.id ? 'bg-dark-800' : ''
                      }`}
                    >
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium truncate">{conv.name}</h3>
                          {conv.last_message_time && (
                            <span className="text-gray-500 text-xs">{formatTime(conv.last_message_time)}</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm truncate">
                          {conv.last_sender_name && `${conv.last_sender_name}: `}
                          {conv.last_message || 'No messages yet'}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">{conv.participant_count} members</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 bg-purple-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Group Messages Area */}
            <Card className="md:col-span-2 overflow-hidden flex flex-col">
              {selectedGroup ? (
                <>
                  <div className="p-4 border-b border-dark-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{selectedGroup.name}</h3>
                        <p className="text-gray-400 text-sm">{selectedGroup.participant_count} members</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {groupMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            msg.message_type === 'system'
                              ? 'bg-dark-700 text-gray-400 text-center text-sm italic'
                              : msg.sender_id === userId
                                ? 'bg-pink-500 text-white rounded-br-sm'
                                : 'bg-dark-800 text-gray-200 rounded-bl-sm'
                          }`}
                        >
                          {msg.message_type !== 'system' && msg.sender_id !== userId && (
                            <p className="text-xs text-purple-400 mb-1 font-medium">{msg.sender_display_name}</p>
                          )}
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
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Select a group chat or create a new one</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Create Group Chat</h2>
                <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name..."
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 mb-4"
              />
              <p className="text-gray-400 text-sm mb-4">
                You can add vendors and coordinators to this group after creating it.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateGroup(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={createGroup} disabled={!newGroupName.trim()} className="flex-1">
                  Create Group
                </Button>
              </div>
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
