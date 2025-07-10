import { Post } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Image, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, memo } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthService } from "@/lib/auth";

interface PostCardProps {
  post: Post;
  optimistic?: boolean;
}

const PostCardComponent = ({ post, optimistic }: PostCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const userId = AuthService.getUser()?.id;

  const likeMutation = useMutation({
    mutationFn: async () => {
      const token = AuthService.getToken();
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to like post");
      return res.json();
    },
    onMutate: () => {
      if (!userId) return;
      setLikes((prev) => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    },
    onSuccess: (updated: Post) => {
      setLikes(updated.likes || []);
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: () => {
      setLikes(post.likes || []);
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (text: string) => {
      const token = AuthService.getToken();
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to comment");
      return res.json();
    },
    onMutate: (text: string) => {
      if (!userId) return;
      setComments((prev) => [
        ...prev.map(c => ({ ...c, createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt) })),
        { userId, userName: AuthService.getUser()?.name || "", text, createdAt: new Date() },
      ]);
      setCommentText("");
    },
    onSuccess: (updated: Post) => {
      setComments(updated.comments || []);
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: () => {
      setComments(post.comments || []);
    }
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 group">
      {post.mediaUrl && (
        <div className="relative">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              controls
              preload="metadata"
              aria-label="Post video"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              aria-label="Post image"
            />
          )}
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
            {post.mediaType === 'video' ? (
              <Video className="h-3 w-3" />
            ) : (
              <Image className="h-3 w-3" />
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {post.userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-foreground">{post.userName}</h3>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        
        <h4 className="font-semibold text-foreground mb-2">{post.title}</h4>
        {post.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
            {post.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center space-x-1 transition-colors ${userId && likes.includes(userId) ? 'text-red-500' : 'hover:text-red-500'}`}
            onClick={() => likeMutation.mutate()}
            aria-label={likes.includes(userId || "") ? "Unlike post" : "Like post"}
          >
            <Heart className="h-4 w-4" />
            <span>Like ({likes.length})</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
            onClick={() => setShowComments((v) => !v)}
            aria-label="Show comments"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comment ({comments.length})</span>
          </Button>
        </div>
        {showComments && (
          <div className="mt-4">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((c, i) => (
                <div key={i} className="border-b pb-1">
                  <span className="font-semibold">{c.userName}:</span> {c.text}
                  <span className="ml-2 text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                </div>
              ))}
              {comments.length === 0 && <div className="text-xs text-muted-foreground">No comments yet.</div>}
            </div>
            <div className="flex mt-2 gap-2">
              <input
                className="flex-1 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-black dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commentMutation.mutate(commentText); }}
                disabled={!userId}
                aria-label="Add a comment"
              />
              <Button size="sm" onClick={() => commentMutation.mutate(commentText)} disabled={!userId || !commentText.trim()} aria-label="Post comment">Post</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PostCard = memo(PostCardComponent);

// Skeleton loader for posts
export function PostCardSkeleton() {
  return (
    <div className="animate-pulse bg-card rounded-lg shadow p-4">
      <div className="h-48 bg-muted rounded mb-4" />
      <div className="flex items-center mb-3">
        <div className="h-10 w-10 rounded-full bg-muted mr-3" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-1/3 mb-1" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
      <div className="h-4 bg-muted rounded w-2/3 mb-2" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="flex gap-2 mt-4">
        <div className="h-8 w-20 bg-muted rounded" />
        <div className="h-8 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}
