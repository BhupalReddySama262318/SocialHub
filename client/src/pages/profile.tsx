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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="myposts">My Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your profile information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    {profileImage ? (
                      <AvatarImage src={profileImage} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <Label htmlFor="profile-image" className="cursor-pointer">
                      <Button variant="outline" className="flex items-center gap-2" disabled={updating}>
                        <Camera className="h-4 w-4" />
                        {updating ? "Uploading..." : "Change Picture"}
                      </Button>
                    </Label>
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size 10MB.
                    </p>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <Button onClick={handleUpdateProfile} disabled={updating} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {updating ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Update your email and password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                  <Button onClick={handleUpdateProfile} disabled={updating} className="w-full mt-2">
                    <Mail className="h-4 w-4 mr-2" />
                    {updating ? "Updating..." : "Update Email"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button onClick={handleChangePassword} disabled={updating} className="w-full mt-2">
                  <Lock className="h-4 w-4 mr-2" />
                  {updating ? "Updating..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="myposts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Posts</CardTitle>
                <CardDescription>View, edit, or delete your posts</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMyPosts ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
                  </div>
                ) : paginatedMyPosts && paginatedMyPosts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paginatedMyPosts.map((post) => (
                        <div key={post.id} className="relative group border rounded-lg">
                          <PostCard post={post} />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="outline" onClick={() => openEditModal(post)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {myPosts && visibleCount < myPosts.length && (
                      <div className="flex justify-center mt-8">
                        <Button onClick={() => setVisibleCount((c) => c + 6)} aria-label="Load more posts">
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">You have not created any posts yet.</div>
                )}
              </CardContent>
            </Card>

            {/* Edit Post Modal */}
            <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-media">Media</Label>
                    <input
                      id="edit-media"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleEditMediaSelect}
                    />
                    {editMediaPreview && (
                      <div className="mt-2">
                        {editMediaPreview.endsWith('.mp4') || editMediaPreview.endsWith('.mov') ? (
                          <video src={editMediaPreview} controls className="w-full max-h-48" />
                        ) : (
                          <img src={editMediaPreview} alt="Preview" className="w-full max-h-48 object-contain" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => setEditPost(null)}>Cancel</Button>
                    <Button onClick={handleEditSave} disabled={updateMutation.isPending}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}