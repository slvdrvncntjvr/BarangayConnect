import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Send, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { insertForumPostSchema, type InsertForumPost, type ForumPost, type ForumReply } from "@shared/schema";

export default function ForumPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const form = useForm<InsertForumPost>({
    resolver: zodResolver(insertForumPostSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Fetch forum posts for user's barangay
  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/forum/posts", user?.barangayId],
    queryFn: async () => {
      const response = await fetch(`/api/forum/posts?barangayId=${user?.barangayId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
    enabled: !!user?.barangayId,
  });

  // Fetch replies for selected post
  const { data: replies = [] } = useQuery<any[]>({
    queryKey: ["/api/forum/replies", selectedPost?.id],
    queryFn: async () => {
      const response = await fetch(`/api/forum/posts/${selectedPost?.id}/replies`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch replies");
      return response.json();
    },
    enabled: !!selectedPost?.id,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: InsertForumPost) => {
      const response = await apiRequest("POST", "/api/forum/posts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your post has been shared with your barangay community",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsCreatePostOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const addReplyMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/forum/posts/${postId}/replies`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply Added",
        description: "Your reply has been posted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/replies"] });
      setReplyContent("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertForumPost) => {
    createPostMutation.mutate(data);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Community Forum</h1>
          <p className="text-slate-600 mt-1">Connect with your barangay neighbors</p>
          {user?.barangay && (
            <p className="text-sm text-primary font-medium">
              {user.barangay.name}, {user.barangay.municipality}
            </p>
          )}
        </div>
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share something with your barangay community
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="What's happening in our barangay?" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Share your thoughts, announcements, or questions..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreatePostOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPostMutation.isPending}>
                    {createPostMutation.isPending ? "Posting..." : "Post"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">Loading community posts...</div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts yet</h3>
              <p className="text-slate-600 mb-4">Be the first to share something with your barangay community!</p>
              <Button onClick={() => setIsCreatePostOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                      {post.author ? getInitials(post.author.firstName, post.author.lastName) : "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">
                        {post.author ? `${post.author.firstName} ${post.author.lastName}` : "Anonymous"}
                      </h3>
                      <span className="text-sm text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2">{post.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                
                {/* Replies Section */}
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                    className="text-primary"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {selectedPost?.id === post.id ? "Hide Replies" : "View Replies"}
                  </Button>
                  
                  {selectedPost?.id === post.id && (
                    <div className="mt-4 space-y-4">
                      {/* Reply Form */}
                      <div className="flex space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-slate-200">
                            {user ? getInitials(user.firstName, user.lastName) : "Y"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex space-x-2">
                          <Input
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && replyContent.trim()) {
                                addReplyMutation.mutate({
                                  postId: post.id,
                                  content: replyContent.trim()
                                });
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (replyContent.trim()) {
                                addReplyMutation.mutate({
                                  postId: post.id,
                                  content: replyContent.trim()
                                });
                              }
                            }}
                            disabled={!replyContent.trim() || addReplyMutation.isPending}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Replies List */}
                      <div className="space-y-3 ml-12">
                        {replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-slate-200 text-xs">
                                {reply.author ? getInitials(reply.author.firstName, reply.author.lastName) : "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {reply.author ? `${reply.author.firstName} ${reply.author.lastName}` : "Anonymous"}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}