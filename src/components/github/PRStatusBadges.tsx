'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, XCircle, GitPullRequest } from 'lucide-react';

interface PRStatusBadgesProps {
  pullRequest: {
    state: 'open' | 'closed' | 'merged';
    reviewStatus: 'pending' | 'approved' | 'changes_requested';
    checksStatus: 'pending' | 'success' | 'failure';
    isDraft: boolean;
  };
}

export function PRStatusBadges({ pullRequest }: PRStatusBadgesProps) {
  const getReviewStatusBadge = () => {
    switch (pullRequest.reviewStatus) {
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Review Approved
          </Badge>
        );
      case 'changes_requested':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            <AlertCircle className="w-3 h-3 mr-1" />
            Changes Requested
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            Review Pending
          </Badge>
        );
    }
  };

  const getChecksStatusBadge = () => {
    switch (pullRequest.checksStatus) {
      case 'success':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Checks Passed
          </Badge>
        );
      case 'failure':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            <XCircle className="w-3 h-3 mr-1" />
            Checks Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
            <Clock className="w-3 h-3 mr-1" />
            Checks Running
          </Badge>
        );
    }
  };

  const getPRStatusBadge = () => {
    if (pullRequest.isDraft) {
      return (
        <Badge variant="outline" className="text-gray-700 border-gray-300 bg-gray-50">
          <GitPullRequest className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      );
    }

    switch (pullRequest.state) {
      case 'merged':
        return (
          <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Merged
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="text-gray-700 border-gray-300 bg-gray-50">
            <XCircle className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        );
      case 'open':
      default:
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <GitPullRequest className="w-3 h-3 mr-1" />
            Open
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {getPRStatusBadge()}
      {pullRequest.state === 'open' && (
        <>
          {getReviewStatusBadge()}
          {getChecksStatusBadge()}
        </>
      )}
    </div>
  );
}

