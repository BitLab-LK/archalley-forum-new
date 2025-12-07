'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface BriefDownloadRequest {
  id: string;
  email: string;
  token: string;
  userId: string | null;
  accessCount: number;
  downloadCount: number;
  lastAccessedAt: string | null;
  firstRequestedAt: string;
  createdAt: string;
}

interface BriefDownloadStats {
  totalRequests: number;
  totalAccesses: number;
  totalDownloads: number;
  uniqueEmails: number;
}

export default function BriefDownloadsManagementSection() {
  const [requests, setRequests] = useState<BriefDownloadRequest[]>([]);
  const [stats, setStats] = useState<BriefDownloadStats>({
    totalRequests: 0,
    totalAccesses: 0,
    totalDownloads: 0,
    uniqueEmails: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/brief-downloads');
      if (!response.ok) {
        throw new Error('Failed to fetch brief download data');
      }

      const data = await response.json();
      setRequests(data.requests || []);
      setStats(data.stats || {
        totalRequests: 0,
        totalAccesses: 0,
        totalDownloads: 0,
        uniqueEmails: 0,
      });
    } catch (err) {
      console.error('Error fetching brief download data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">Email requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueEmails}</div>
            <p className="text-xs text-muted-foreground">Different email addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Link Accesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccesses}</div>
            <p className="text-xs text-muted-foreground">Times links were clicked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">Files downloaded</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brief Download Requests</CardTitle>
          <CardDescription>
            List of all email addresses that requested the competition brief download link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No download requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Email</th>
                    <th className="text-left p-3 font-semibold">First Requested</th>
                    <th className="text-center p-3 font-semibold">Link Accesses</th>
                    <th className="text-center p-3 font-semibold">Downloads</th>
                    <th className="text-left p-3 font-semibold">Last Accessed</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">{request.email}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(request.firstRequestedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">{request.accessCount}</td>
                      <td className="p-3 text-center font-semibold">{request.downloadCount}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {request.lastAccessedAt
                          ? new Date(request.lastAccessedAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

