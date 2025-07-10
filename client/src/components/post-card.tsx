import { Post } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Image, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

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
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
          <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-red-500 transition-colors">
            <Heart className="h-4 w-4" />
            <span>Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-green-500 transition-colors">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
