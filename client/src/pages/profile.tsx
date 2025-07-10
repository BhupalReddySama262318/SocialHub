import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthService } from "@/lib/auth";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CloudinaryService } from "@/lib/cloudinary";
import { Camera, User as UserIcon, Mail, Lock, Save } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // My Posts state
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMedia, setEditMedia] = useState<File | null>(null);
  const [editMediaPreview, setEditMediaPreview] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        setLocation("/login");
        return;
      }
      setUser(currentUser);
      setName(currentUser.name);
      setEmail(currentUser.email);
      setLoading(false);
    };

    checkAuth();
  }, [setLocation]);

  const { data: myPosts, refetch: refetchMyPosts, isLoading: loadingMyPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/posts/user/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const token = AuthService.getToken();
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      refetchMyPosts();
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({ title: "Post deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, description, mediaUrl, mediaType }: { id: string; title: string; description?: string; mediaUrl?: string; mediaType?: string }) => {
      const token = AuthService.getToken();
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, mediaUrl, mediaType }),
      });
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    },
    onSuccess: () => {
      setEditPost(null);
      refetchMyPosts();
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({ title: "Post updated" });
    },
    onError: () => {
      toast({ title: "Failed to update post", variant: "destructive" });
    },
  });

  const openEditModal = (post: Post) => {
    setEditPost(post);
    setEditTitle(post.title);
    setEditDescription(post.description || "");
    setEditMedia(null);
    setEditMediaPreview(post.mediaUrl || null);
  };

  const handleEditSave = async () => {
    if (!editPost) return;
    let mediaUrl = editPost.mediaUrl;
    let mediaType = editPost.mediaType;
    if (editMedia) {
      // Upload new media to Cloudinary
      try {
        const formData = new FormData();
        formData.append('file', editMedia);
        formData.append('upload_preset', 'socialhub'); // adjust if needed
        const res = await fetch(`https://api.cloudinary.com/v1_1/dapc3rkho/${editMedia.type.startsWith('video/') ? 'video' : 'image'}/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        mediaUrl = data.secure_url;
        mediaType = editMedia.type.startsWith('video/') ? 'video' : 'image';
      } catch (e) {
        toast({ title: 'Failed to upload media', variant: 'destructive' });
        return;
      }
    }
    updateMutation.mutate({ id: editPost.id, title: editTitle, description: editDescription, mediaUrl, mediaType } as any);
  };

  const handleDelete = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(postId);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!CloudinaryService.isValidFileType(file)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPEG, PNG, or GIF)",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const imageUrl = await CloudinaryService.uploadFile(file);
      setProfileImage(imageUrl);
      toast({
        title: "Image uploaded",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      const token = AuthService.getToken();
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, profileImage }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.message && data.message.toLowerCase().includes('exists')) {
          throw new Error('Email already exists. Please use a different email.');
        }
        throw new Error("Failed to update profile");
      }
      const data = await res.json();
      setUser(data.user);
      AuthService.setUser(data.user);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation password don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const token = AuthService.getToken();
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to change password");
      }
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your posts will be deleted.")) return;
    try {
      const token = AuthService.getToken();
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete account");
      await AuthService.logout();
      queryClient.clear();
      window.dispatchEvent(new Event('storage'));
      setLocation("/");
      toast({ title: "Account deleted" });
    } catch (error) {
      toast({ title: "Failed to delete account", variant: "destructive" });
    }
  };

  const handleEditMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditMedia(file);
      setEditMediaPreview(URL.createObjectURL(file));
    }
  };

  const [visibleCount, setVisibleCount] = useState(6);
  const paginatedMyPosts = myPosts ? myPosts.slice(0, visibleCount) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted/50 px-2 sm:px-4 py-4">
      <Card className="w-full max-w-2xl mb-4 p-3 sm:p-6">
        <CardHeader className="text-center p-2 sm:p-4">
          <div className="flex flex-col items-center gap-2 mb-2 sm:mb-4">
            <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
              {user?.profileImage ? (
                <AvatarImage src={user.profileImage} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <Button asChild size="sm" className="mt-1">
              <label htmlFor="profile-image-upload" className="cursor-pointer text-xs sm:text-sm">
                <Camera className="inline h-4 w-4 mr-1" /> Change Photo
                <input id="profile-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </Button>
          </div>
          <CardTitle className="text-lg sm:text-2xl font-bold mb-1">{user?.name}</CardTitle>
          <CardDescription className="text-xs sm:text-base">{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex flex-wrap gap-2 mb-2 sm:mb-4">
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
              <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
              <TabsTrigger value="posts" className="text-xs sm:text-sm">My Posts</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <form className="space-y-2 sm:space-y-4" onSubmit={e => { e.preventDefault(); handleUpdateProfile(); }}>
                <div>
                  <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 text-xs sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                  <Input id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 text-xs sm:text-sm" />
                </div>
                <Button type="submit" className="w-full sm:w-auto mt-2 sm:mt-4">Update Profile</Button>
              </form>
            </TabsContent>
            <TabsContent value="security">
              <form className="space-y-2 sm:space-y-4" onSubmit={e => { e.preventDefault(); handleChangePassword(); }}>
                <div>
                  <Label htmlFor="current-password" className="text-xs sm:text-sm">Current Password</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 text-xs sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="new-password" className="text-xs sm:text-sm">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 text-xs sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-xs sm:text-sm">Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 text-xs sm:text-sm" />
                </div>
                <Button type="submit" className="w-full sm:w-auto mt-2 sm:mt-4">Change Password</Button>
              </form>
            </TabsContent>
            <TabsContent value="posts">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                {loadingMyPosts ? (
                  Array.from({ length: 2 }).map((_, i) => <PostCardSkeleton key={i} />)
                ) : myPosts && myPosts.length > 0 ? (
                  myPosts.map(post => (
                    <div key={post.id} className="relative">
                      <PostCard post={post} />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditModal(post)} aria-label="Edit post"><Save className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(post.id)} aria-label="Delete post"><Lock className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">No posts yet.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Responsive Dialog for editing posts */}
      {editPost && (
        <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
          <DialogContent className="max-w-xs sm:max-w-lg w-full p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 sm:space-y-4">
              <Label htmlFor="edit-title" className="text-xs sm:text-sm">Title</Label>
              <Input id="edit-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-xs sm:text-sm" />
              <Label htmlFor="edit-description" className="text-xs sm:text-sm">Description</Label>
              <Textarea id="edit-description" value={editDescription} onChange={e => setEditDescription(e.target.value)} className="text-xs sm:text-sm" />
              <Label className="text-xs sm:text-sm">Media</Label>
              <input type="file" accept="image/*,video/*" onChange={handleEditMediaSelect} className="text-xs sm:text-sm" />
              {editMediaPreview && (
                <div className="mt-2">
                  {editPost.mediaType === 'video' ? (
                    <video src={editMediaPreview} className="w-full h-40 object-contain rounded" controls />
                  ) : (
                    <img src={editMediaPreview} className="w-full h-40 object-contain rounded" alt="Preview" />
                  )}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="secondary" onClick={() => setEditPost(null)}>Cancel</Button>
                <Button size="sm" onClick={handleEditSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}