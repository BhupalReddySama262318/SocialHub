import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });
  const [visibleCount, setVisibleCount] = useState(9);
  const paginatedPosts = posts ? posts.slice(0, visibleCount) : [];

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load posts. Please try again.</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Share Your <span className="text-gradient">Moments</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with friends and share your experiences through photos and videos
        </p>
      </section>

      {/* Posts Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">Latest Posts</h2>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              Grid View
            </Button>
            <Button variant="ghost" size="sm">
              List View
            </Button>
          </div>
        </div>
        
        {paginatedPosts && paginatedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {posts && visibleCount < posts.length && (
              <div className="flex justify-center mt-8">
                <Button onClick={() => setVisibleCount((c) => c + 9)} aria-label="Load more posts">
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </div>
        )}
      </section>
    </main>
  );
}
