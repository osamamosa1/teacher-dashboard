import { useEffect, useState } from 'react';
import { Loader2, X, Eye, ThumbsUp, MessageCircle, Send, Reply } from 'lucide-react';
import api from '../api/axios';

const CommentThread = ({ comment, onReply, replyToId, setReplyToId, replyText, setReplyText, onSubmitReply, sending }) => {
  const isTeacher = comment.sender_role === 'teacher';
  const isReplying = replyToId === comment.id;

  return (
    <div className={`rounded-xl border p-3 ${isTeacher ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-[#E2E8F0]'}`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <p className="text-sm font-bold text-[#0F172A]">
            {comment.student_name}
            {isTeacher && <span className="ml-2 text-[10px] uppercase tracking-widest text-indigo-600">Teacher</span>}
          </p>
          <p className="text-[10px] text-[#94A3B8]">{comment.created_at}</p>
        </div>
        <button
          type="button"
          onClick={() => setReplyToId(isReplying ? null : comment.id)}
          className="text-[#64748B] hover:text-indigo-600 flex items-center gap-1 text-xs font-bold"
        >
          <Reply size={14} /> Reply
        </button>
      </div>
      <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">{comment.comment}</p>

      {comment.replies?.length > 0 && (
        <div className="mt-3 ml-4 space-y-2 border-l-2 border-[#E2E8F0] pl-3">
          {comment.replies.map((r) => (
            <CommentThread
              key={r.id}
              comment={r}
              onReply={onReply}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              sending={sending}
            />
          ))}
        </div>
      )}

      {isReplying && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitReply(comment.id);
          }}
        >
          <input
            className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-indigo-400"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="px-3 py-2 rounded-lg bg-[#0F172A] text-white disabled:opacity-50"
          >
            {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />}
          </button>
        </form>
      )}
    </div>
  );
};

const VideoLessonInsightsModal = ({ lesson, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('comments');
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teacher/lessons/${lesson.id}/video/insights`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load video insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [lesson.id]);

  const postComment = async (text, parentId = null) => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/teacher/lessons/${lesson.id}/comments`, {
        comment: text.trim(),
        parent_comment_id: parentId,
      });
      setCommentText('');
      setReplyText('');
      setReplyToId(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { id: 'comments', label: 'Comments', icon: MessageCircle, count: data?.comments_count },
    { id: 'viewers', label: 'Viewers', icon: Eye, count: data?.viewers_count },
    { id: 'likes', label: 'Likes', icon: ThumbsUp, count: data?.likes_count },
  ];

  return (
    <div className="fixed inset-0 lg:left-[260px] bg-[#0F172A]/40 backdrop-blur-sm z-[280] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#F1F5F9] flex justify-between items-start shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Video Lesson</p>
            <h2 className="text-xl font-extrabold text-[#0F172A]">{lesson.title}</h2>
            {data && (
              <p className="text-sm text-[#64748B] mt-1">
                {data.viewers_count} viewers · {data.likes_count} likes · {data.comments_count} comments
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#F8FAFC] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-[#F1F5F9] px-4 shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                  tab === t.id ? 'border-[#0F172A] text-[#0F172A]' : 'border-transparent text-[#94A3B8]'
                }`}
              >
                <Icon size={16} />
                {t.label}
                {t.count != null && <span className="text-xs bg-[#F1F5F9] px-2 py-0.5 rounded-full">{t.count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : tab === 'viewers' ? (
            data?.viewers?.length ? (
              <div className="space-y-2">
                {data.viewers.map((v) => (
                  <div key={v.student_id} className="flex justify-between items-center p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <div>
                      <p className="font-bold text-sm text-[#0F172A]">{v.student_name}</p>
                      <p className="text-xs text-[#94A3B8]">Watched: {v.watched_at}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">+{v.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#94A3B8] py-12">No students watched 50% yet</p>
            )
          ) : tab === 'likes' ? (
            data?.likes?.length ? (
              <div className="space-y-2">
                {data.likes.map((l) => (
                  <div key={`${l.student_id}-${l.liked_at}`} className="flex justify-between items-center p-3 rounded-xl border border-[#E2E8F0]">
                    <p className="font-bold text-sm text-[#0F172A]">{l.student_name}</p>
                    <p className="text-xs text-[#94A3B8]">{l.liked_at}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#94A3B8] py-12">No likes yet</p>
            )
          ) : (
            <div className="space-y-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  postComment(commentText);
                }}
              >
                <input
                  className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-indigo-400"
                  placeholder="Write a comment to students..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={sending || !commentText.trim()}
                  className="px-4 rounded-xl bg-[#0F172A] text-white font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={16} />}
                  Post
                </button>
              </form>

              {data?.comments?.length ? (
                <div className="space-y-3">
                  {data.comments.map((c) => (
                    <CommentThread
                      key={c.id}
                      comment={c}
                      replyToId={replyToId}
                      setReplyToId={setReplyToId}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      onSubmitReply={(id) => postComment(replyText, id)}
                      sending={sending}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#94A3B8] py-8">No comments yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoLessonInsightsModal;
