import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Send, 
  MessageSquare, 
  Search, 
  User as UserIcon, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface Contact {
  _id: string;
  name: string;
  email: string;
  ratingAverage: number;
}

interface Conversation {
  user: Contact;
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: string;
  };
}

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const location = useLocation();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active conversations
  const fetchConversations = async (autoSelect?: Contact) => {
    setContactsLoading(true);
    try {
      const res = await API.get('/chat/conversations');
      if (res.data.success) {
        let list: Conversation[] = res.data.data;
        
        // If we navigated here with autoSelectContact state (e.g. from Product Details)
        if (autoSelect) {
          // Check if contact already exists in list
          const exists = list.some((c) => c.user._id === autoSelect._id);
          if (!exists) {
            // Add a mock conversation entry for this new contact
            const newConv: Conversation = {
              user: autoSelect,
              lastMessage: {
                text: 'Start typing to begin conversation...',
                createdAt: new Date().toISOString(),
                senderId: '',
              },
            };
            list = [newConv, ...list];
          }
          setSelectedContact(autoSelect);
        }
        
        setConversations(list);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    // Read router state redirect triggers
    const state = location.state as { autoSelectContact?: Contact } | null;
    fetchConversations(state?.autoSelectContact);
  }, [location.state]);

  // Fetch messages when selected contact changes
  useEffect(() => {
    if (!selectedContact) return;
    
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await API.get(`/chat/messages/${selectedContact._id}`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedContact]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for socket messages in real-time
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: Message) => {
      // If message belongs to selected contact conversation
      if (
        selectedContact && 
        ((msg.senderId === selectedContact._id && msg.receiverId === user?._id) || 
         (msg.senderId === user?._id && msg.receiverId === selectedContact._id))
      ) {
        setMessages((prev) => [...prev, msg]);
      }

      // Update the conversations list preview text and order
      setConversations((prev) => {
        const otherPartyId = msg.senderId === user?._id ? msg.receiverId : msg.senderId;
        const matchingConvIndex = prev.findIndex((c) => c.user._id === otherPartyId);

        if (matchingConvIndex !== -1) {
          const updated = [...prev];
          updated[matchingConvIndex].lastMessage = {
            text: msg.text,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
          };
          // Move matching contact to top
          const [moved] = updated.splice(matchingConvIndex, 1);
          return [moved, ...updated];
        } else {
          // Fetch contacts again if it's a completely new person messaging us
          fetchConversations();
          return prev;
        }
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, selectedContact, user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact || !socket) return;

    const messageData = {
      receiverId: selectedContact._id,
      text: inputText.trim(),
    };

    // Emit via Socket.io
    socket.emit('send_message', messageData, (response: any) => {
      if (response && response.success) {
        setInputText('');
      } else {
        alert('Failed to send message: Server error');
      }
    });
  };

  const filteredConversations = conversations.filter((c) => 
    c.user.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[75vh] flex">
        
        {/* Left pane: Contact listing list */}
        <div className="w-full md:w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/60 h-full">
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white font-sans flex items-center space-x-1.5">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              <span>Campus Chats</span>
            </h2>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Contact Lists scroll area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
            {contactsLoading ? (
              <div className="p-6 text-center space-y-2.5">
                <div className="w-6 h-6 border-2 border-t-primary-500 border-slate-200 dark:border-slate-800 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400">Loading contacts...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs">No active chats.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedContact?._id === conv.user._id;
                const isOnline = isUserOnline(conv.user._id);

                return (
                  <button
                    key={conv.user._id}
                    onClick={() => setSelectedContact(conv.user)}
                    className={`w-full text-left p-4 flex items-center space-x-3 transition-colors ${
                      isSelected
                        ? 'bg-primary-50/50 dark:bg-primary-950/20 border-l-4 border-l-primary-500'
                        : 'hover:bg-slate-100/50 dark:hover:bg-slate-850/40'
                    }`}
                  >
                    {/* Contact Avatar & Status bubble */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-855 text-slate-600 dark:text-slate-350 flex items-center justify-center font-bold">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      {/* status dot */}
                      <span 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                          isOnline ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`} 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                          {conv.user.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {conv.lastMessage.senderId === user?._id ? 'You: ' : ''}
                        {conv.lastMessage.text}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Active messaging dialogue window */}
        <div className="flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-slate-950/10">
          {selectedContact ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold">
                      <UserIcon className="w-4.5 h-4.5" />
                    </div>
                    <span 
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${
                        isUserOnline(selectedContact._id) ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`} 
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedContact.name}
                    </h3>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500">
                      {isUserOnline(selectedContact._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat messages stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/20 scrollbar-thin">
                {messagesLoading ? (
                  <div className="text-center py-6 text-xs text-slate-400">Loading conversation history...</div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-800" />
                    <p className="text-xs">Send a message to begin trading safely.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isSender = msg.senderId === user?._id;
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'} w-full fade-in`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm font-medium ${
                            isSender
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 text-slate-900 dark:text-slate-100 rounded-bl-none'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <span 
                            className={`block text-[9px] mt-1 text-right ${
                              isSender ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input toolbar */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 flex items-center space-x-2.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-55/30 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white shadow-md shadow-primary-500/10 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-550 space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl">
                <MessageSquare className="w-10 h-10 text-slate-350" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Select a Conversation</h3>
              <p className="text-xs max-w-xs leading-relaxed text-slate-500 dark:text-slate-450">
                Choose a contact from the left list, or start a chat from any product detail page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
