/**
 * Submissions Management Section for Admin Dashboard
 * Displays all competition submissions with user, registration, and attachment details
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Download, RefreshCw, FileText, Image, Video, CheckCircle, XCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface Submission {
  id: string;
  registrationNumber: string;
  submissionCategory: string;
  title: string;
  description: string;
  status: string;
  keyPhotographUrl: string;
  additionalPhotographs: string[];
  documentFileUrl: string | null;
  videoFileUrl: string | null;
  fileMetadata: any;
  submittedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  registration: {
    id: string;
    registrationNumber: string;
    status: string;
    country: string;
    participantType: string;
    teamName: string | null;
    companyName: string | null;
    amountPaid: number;
    currency: string;
    createdAt: string;
    competition: {
      id: string;
      title: string;
    };
    registrationType: {
      id: string;
      name: string;
    };
  } | null;
}

export default function SubmissionsManagementSection() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Action dialogs
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [validationNotes, setValidationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchQuery, submissions]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setFilteredSubmissions(data.submissions);
      } else {
        toast.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('An error occurred while fetching submissions');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    if (!searchQuery) {
      setFilteredSubmissions(submissions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = submissions.filter(
      (sub) =>
        sub.registrationNumber.toLowerCase().includes(query) ||
        sub.title.toLowerCase().includes(query) ||
        sub.user.name.toLowerCase().includes(query) ||
        sub.user.email.toLowerCase().includes(query) ||
        sub.registration?.registrationNumber.toLowerCase().includes(query) ||
        sub.registration?.competition.title.toLowerCase().includes(query)
    );
    setFilteredSubmissions(filtered);
  };

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleValidateClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setValidationNotes('');
    setValidateDialogOpen(true);
  };

  const handleRejectClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleValidateSubmission = async () => {
    if (!selectedSubmission) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/submissions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          validationNotes: validationNotes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Submission validated successfully');
        setValidateDialogOpen(false);
        setValidationNotes('');
        fetchSubmissions(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to validate submission');
      }
    } catch (error) {
      console.error('Error validating submission:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmission = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          rejectionReason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Submission rejected');
        setRejectDialogOpen(false);
        setRejectionReason('');
        fetchSubmissions(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to reject submission');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishSubmission = async (submission: Submission) => {
    if (submission.status !== 'VALIDATED') {
      toast.error('Only validated submissions can be published');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/submissions/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Submission published successfully');
        fetchSubmissions(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to publish submission');
      }
    } catch (error) {
      console.error('Error publishing submission:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      VALIDATED: 'bg-green-100 text-green-800',
      PUBLISHED: 'bg-purple-100 text-purple-800',
      REJECTED: 'bg-red-100 text-red-800',
      WITHDRAWN: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    return (
      <Badge className={category === 'DIGITAL' ? 'bg-cyan-100 text-cyan-800' : 'bg-orange-100 text-orange-800'}>
        {category}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Competition Submissions</CardTitle>
              <CardDescription>
                Manage and review all competition submissions
              </CardDescription>
            </div>
            <Button onClick={fetchSubmissions} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by submission number, title, user, registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Submissions</div>
              <div className="text-2xl font-bold text-blue-900">{submissions.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Submitted</div>
              <div className="text-2xl font-bold text-green-900">
                {submissions.filter((s) => s.status === 'SUBMITTED').length}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Published</div>
              <div className="text-2xl font-bold text-purple-900">
                {submissions.filter((s) => s.status === 'PUBLISHED').length}
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration Number</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading submissions...
                    </TableCell>
                  </TableRow>
                ) : filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm">
                        {submission.registration?.registrationNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {submission.user.image ? (
                              <img src={submission.user.image} alt={submission.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium">{submission.user.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{submission.user.name}</div>
                            <div className="text-xs text-gray-500">{submission.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {submission.registration?.competition.title || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {submission.title}
                      </TableCell>
                      <TableCell>{getCategoryBadge(submission.submissionCategory)}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleDateString()
                          : 'Not submitted'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => handleViewSubmission(submission)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          
                          {submission.status === 'SUBMITTED' && (
                            <>
                              <Button
                                onClick={() => handleValidateClick(submission)}
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Validate
                              </Button>
                              <Button
                                onClick={() => handleRejectClick(submission)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {submission.status === 'VALIDATED' && (
                            <>
                              <Button
                                onClick={() => handlePublishSubmission(submission)}
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                disabled={actionLoading}
                              >
                                <Globe className="w-4 h-4 mr-1" />
                                Publish
                              </Button>
                              <Button
                                onClick={() => handleRejectClick(submission)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Submission Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Complete submission information with attachments
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Submission Number</label>
                  <p className="text-sm font-mono mt-1">{selectedSubmission.registrationNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Number</label>
                  <p className="text-sm font-mono mt-1">
                    {selectedSubmission.registration?.registrationNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1">{getCategoryBadge(selectedSubmission.submissionCategory)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>

              {/* User Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm mt-1">{selectedSubmission.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm mt-1">{selectedSubmission.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              {selectedSubmission.registration && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Registration Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Competition</label>
                      <p className="text-sm mt-1">{selectedSubmission.registration.competition.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Registration Type</label>
                      <p className="text-sm mt-1">{selectedSubmission.registration.registrationType.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Country</label>
                      <p className="text-sm mt-1">{selectedSubmission.registration.country}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Participant Type</label>
                      <p className="text-sm mt-1">{selectedSubmission.registration.participantType}</p>
                    </div>
                    {selectedSubmission.registration.teamName && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Team Name</label>
                        <p className="text-sm mt-1">{selectedSubmission.registration.teamName}</p>
                      </div>
                    )}
                    {selectedSubmission.registration.companyName && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Company</label>
                        <p className="text-sm mt-1">{selectedSubmission.registration.companyName}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Amount Paid</label>
                      <p className="text-sm mt-1">
                        {selectedSubmission.registration.currency} {selectedSubmission.registration.amountPaid}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Content */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Submission Content</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <p className="text-sm mt-1">{selectedSubmission.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedSubmission.description}</p>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Attachments</h3>
                <div className="space-y-4">
                  {/* Key Photograph */}
                  {selectedSubmission.keyPhotographUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Image className="w-4 h-4" />
                        Key Photograph
                      </label>
                      <a
                        href={selectedSubmission.keyPhotographUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        View/Download
                      </a>
                    </div>
                  )}

                  {/* Additional Photographs */}
                  {selectedSubmission.additionalPhotographs.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Image className="w-4 h-4" />
                        Additional Photographs ({selectedSubmission.additionalPhotographs.length})
                      </label>
                      <div className="space-y-1">
                        {selectedSubmission.additionalPhotographs.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Photo {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document */}
                  {selectedSubmission.documentFileUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" />
                        Supporting Document
                      </label>
                      <a
                        href={selectedSubmission.documentFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                    </div>
                  )}

                  {/* Video */}
                  {selectedSubmission.videoFileUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4" />
                        Video Presentation
                      </label>
                      <a
                        href={selectedSubmission.videoFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download Video
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Timestamps</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1">{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedSubmission.submittedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Submitted</label>
                      <p className="mt-1">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Validate Submission Dialog */}
      <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Submission</DialogTitle>
            <DialogDescription>
              Approve this submission and mark it ready for publishing
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Submission: {selectedSubmission.registrationNumber}</p>
                <p className="text-sm text-gray-600">{selectedSubmission.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Validation Notes (Optional)
                </label>
                <Textarea
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Add any notes about this validation..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setValidateDialogOpen(false)}
                  variant="outline"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleValidateSubmission}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validate Submission
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Submission Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Reject this submission and provide a reason
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Submission: {selectedSubmission.registrationNumber}</p>
                <p className="text-sm text-gray-600">{selectedSubmission.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this submission is being rejected..."
                  className="mt-1"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setRejectDialogOpen(false)}
                  variant="outline"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectSubmission}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Submission
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
