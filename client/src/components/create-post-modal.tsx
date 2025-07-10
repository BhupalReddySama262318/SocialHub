import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthService } from "@/lib/auth";
import { CloudinaryService } from "@/lib/cloudinary";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CloudUpload, X } from "lucide-react";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type CreatePostData = z.infer<typeof createPostSchema>;

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreatePostData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!CloudinaryService.isValidFileType(file)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image or video file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: CreatePostData) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      // Invalidate user's posts for profile page
      const user = AuthService.getUser();
      if (user) {
        await queryClient.invalidateQueries({ queryKey: ["/api/posts/user", user.id] });
      }
      
      toast({
        title: "Post created successfully!",
        description: "Your post has been shared with the community.",
      });

      form.reset();
      setSelectedFile(null);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="What's on your mind?"
              className="mt-1"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Tell us more about it..."
              rows={3}
              className="mt-1 resize-none"
            />
          </div>

          <div>
            <Label>Media</Label>
            <div className="mt-1">
              {selectedFile ? (
                <div className="relative">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => document.getElementById('media-upload')?.click()}
                >
                  <CloudUpload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Click to upload images or videos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports JPG, PNG, GIF, MP4, MOV (max 10MB)
                  </p>
                </div>
              )}
              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isUploading}
            >
              {isUploading ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
