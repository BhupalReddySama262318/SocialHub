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
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <section className="mb-6 sm:mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
    <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="text-center mb-6 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 sm:mb-4">
          Share Your <span className="text-gradient">Moments</span>
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with friends and share your experiences through photos and videos
        </p>
      </section>

      {/* Posts Section */}
      <section className="mb-6 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-8 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Latest Posts</h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {paginatedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {posts && visibleCount < posts.length && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <Button onClick={() => setVisibleCount((c) => c + 9)} aria-label="Load more posts">
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </div>
        )}
      </section>
    </main>
  );
}
