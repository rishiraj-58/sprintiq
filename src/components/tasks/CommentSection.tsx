'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { MessageCircle, Send, AtSign } from 'lucide-react';
import { useTask } from '@/stores/hooks/useTask';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface WorkspaceMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface CommentSectionProps {
  taskId: string;
  workspaceId: string;
}

export function CommentSection({ taskId, workspaceId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    comments, 
    isCommentsLoading, 
    commentsError, 
    fetchComments, 
    addComment 
  } = useTask();
  
  const { toast } = useToast();
  const { canEdit } = usePermissions('workspace', workspaceId);

  // Fetch workspace members for @mentions
  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (response.ok) {
          const data = await response.json();
          setWorkspaceMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error fetching workspace members:', error);
      }
    };

    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId]);

  // Fetch comments when component mounts
  useEffect(() => {
    if (taskId) {
      fetchComments(taskId);
    }
  }, [taskId, fetchComments]);

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  const getName = (firstName: string | null, lastName: string | null) => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
  };

  // Handle @mention detection
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a space after @, if so, hide suggestions
      if (textAfterAt.includes(' ')) {
        setShowMentionSuggestions(false);
      } else {
        setMentionQuery(textAfterAt.toLowerCase());
        setMentionPosition(lastAtIndex);
        setShowMentionSuggestions(true);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (member: WorkspaceMember) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterMention = newComment.substring(mentionPosition + mentionQuery.length + 1);
    const memberName = getName(member.firstName, member.lastName);
    
    const updatedComment = `${beforeMention}@${memberName}${afterMention}`;
    setNewComment(updatedComment);
    setShowMentionSuggestions(false);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newPosition = beforeMention.length + memberName.length + 1;
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  // Filter members based on mention query
  const filteredMembers = workspaceMembers.filter(member => {
    if (!mentionQuery) return true;
    const fullName = getName(member.firstName, member.lastName).toLowerCase();
    return fullName.includes(mentionQuery) || member.email?.toLowerCase().includes(mentionQuery);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(taskId, newComment.trim());
      setNewComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse comment content to highlight @mentions
  const parseCommentContent = (content: string) => {
    const mentionRegex = /@([A-Za-z\s]+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <Badge key={index} variant="secondary" className="mx-1">
            @{part}
          </Badge>
        );
      }
      return part;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        {canEdit && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleTextareaChange}
                placeholder="Add a comment... Use @ to mention team members"
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
              
              {/* Mention Suggestions */}
              {showMentionSuggestions && filteredMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredMembers.slice(0, 5).map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                      onClick={() => handleMentionSelect(member)}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.firstName, member.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getName(member.firstName, member.lastName)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                <AtSign className="h-3 w-3 inline mr-1" />
                Type @ to mention team members
              </p>
              <Button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post Comment
              </Button>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {isCommentsLoading ? (
            <div className="text-center py-8">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground mt-2">Loading comments...</p>
            </div>
          ) : commentsError ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">{commentsError}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground">
                Be the first to add a comment!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 border rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.author.firstName, comment.author.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getName(comment.author.firstName, comment.author.lastName)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-foreground leading-relaxed">
                    {parseCommentContent(comment.content)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
