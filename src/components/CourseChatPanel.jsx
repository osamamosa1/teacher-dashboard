import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import api from '../api/axios';

const initials = (name) => {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ChatBubble = ({ message, onDelete }) => {
  const isMine = message.is_mine;
  const isTeacher = message.sender_role === 'teacher';
  const senderName = message.sender_name || '';
  const displayName = isMine ? 'You (Teacher)' : senderName;

  let bubbleClass;
  let nameColor;
  let avatarBg;

  if (isMine) {
    bubbleClass = 'bg-[#0F172A] text-white border-transparent';
    nameColor = 'text-[#64748B]';
    avatarBg = 'bg-slate-200 text-[#0F172A]';
  } else if (isTeacher) {
    bubbleClass = 'bg-indigo-50 text-[#0F172A] border-indigo-100';
    nameColor = 'text-indigo-600';
    avatarBg = 'bg-indigo-100 text-indigo-600';
  } else {
    bubbleClass = 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]';
    nameColor = 'text-[#64748B]';
    avatarBg = 'bg-slate-100 text-[#64748B]';
  }

  return (
    <div className={`flex items-end gap-2 mb-3.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${avatarBg}`}>
          {initials(senderName)}
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <p className={`text-[10px] font-bold ${nameColor}`}>{displayName}</p>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="text-red-400 hover:text-red-600 p-0.5"
              title="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <div className={`rounded-2xl px-4 py-3 border shadow-sm ${bubbleClass} ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
          {message.created_at && (
            <p className={`text-[10px] mt-1 ${isMine ? 'text-white/50' : 'text-[#94A3B8]'}`}>{message.created_at}</p>
          )}
        </div>
      </div>

      {isMine && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${avatarBg}`}>
          {initials('Teacher')}
        </div>
      )}
    </div>
  );
};

const CourseChatPanel = ({ courseId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef(0);
  const bottomRef = useRef(null);

  const loadMessages = async (initial = false) => {
    try {
      const after = lastIdRef.current > 0 ? `?after_id=${lastIdRef.current}` : '';
      const res = await api.get(`/teacher/courses/${courseId}/messages${after}`);
      const list = res.data.data || [];
      if (list.length > 0) {
        setMessages((prev) => {
          if (lastIdRef.current === 0) return list;
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = list.filter((m) => !existingIds.has(m.id));
          return newOnes.length ? [...prev, ...newOnes] : prev;
        });
        lastIdRef.current = list[list.length - 1].id;
      } else if (initial) {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    lastIdRef.current = 0;
    setMessages([]);
    setLoading(true);
    loadMessages(true);
    const interval = setInterval(() => loadMessages(false), 5000);
    return () => clearInterval(interval);
  }, [courseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await api.delete(`/teacher/courses/${courseId}/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/teacher/courses/${courseId}/messages`, { message: text.trim() });
      const msg = res.data.data;
      setText('');
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      lastIdRef.current = msg.id;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-[#64748B]">
        <Loader2 className="animate-spin w-6 h-6" /> Loading chat...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[420px] border border-[#E2E8F0] rounded-2xl bg-[#F1F5F9] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[#94A3B8] font-medium">No messages yet. Say hello to your students!</p>
          </div>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} onDelete={handleDelete} />)
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="border-t border-[#E2E8F0] p-4 flex gap-3 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <input
          className="flex-1 rounded-full border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-[#F8FAFC]"
          placeholder="Type a message to students..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-11 h-11 rounded-xl bg-[#0F172A] text-white flex items-center justify-center disabled:opacity-50 shrink-0"
        >
          {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

export default CourseChatPanel;
