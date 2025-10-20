import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Send, Paperclip, Image as ImageIcon, FileText, Download, User } from 'lucide-react';

export default function CircleChatView({ db, storage, stakeId, wardId, circleId, currentMemberId, currentMemberName, circleMembers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId, 'chats'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [db, stakeId, wardId, circleId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `circles/${circleId}/chat/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        const fileType = file.type.startsWith('image/') ? 'image' : 'document';

        await addDoc(collection(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId, 'chats'), {
          memberId: currentMemberId,
          memberName: currentMemberName,
          type: fileType,
          fileUrl: downloadUrl,
          fileName: file.name,
          fileSize: file.size,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId, 'chats'), {
        memberId: currentMemberId,
        memberName: currentMemberName,
        type: 'text',
        message: newMessage.trim(),
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMemberProfile = (memberId) => {
    return circleMembers.find(m => m.id === memberId);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-blue-100 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Circle Chat</h2>
        <p className="text-sm text-gray-600">{circleMembers.length} members</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.memberId === currentMemberId;
            const memberProfile = getMemberProfile(msg.memberId);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {memberProfile?.profilePicUrl ? (
                    <img
                      src={memberProfile.profilePicUrl}
                      alt={msg.memberName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-sm font-medium text-gray-800">{msg.memberName}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(msg.createdAt)}</span>
                  </div>

                  {msg.type === 'text' && (
                    <div className={`px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  )}

                  {msg.type === 'image' && (
                    <div className={`rounded-lg overflow-hidden border-2 ${
                      isCurrentUser ? 'border-blue-500' : 'border-gray-200'
                    }`}>
                      <img
                        src={msg.fileUrl}
                        alt={msg.fileName}
                        className="max-w-full max-h-64 object-contain cursor-pointer"
                        onClick={() => window.open(msg.fileUrl, '_blank')}
                      />
                      <div className={`px-3 py-2 text-xs ${
                        isCurrentUser ? 'bg-blue-50' : 'bg-gray-50'
                      }`}>
                        <p className="font-medium truncate">{msg.fileName}</p>
                      </div>
                    </div>
                  )}

                  {msg.type === 'document' && (
                    <div className={`px-4 py-3 rounded-lg border-2 ${
                      isCurrentUser
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{msg.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {(msg.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Download className="w-5 h-5 text-blue-600" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        {uploading && (
          <div className="mb-2 text-sm text-blue-600">
            Uploading file...
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={uploading || sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || uploading || sending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}