"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';

interface Submission {
  id: string;
  registrationNumber: string;
  title: string;
  description: string;
  keyPhotographUrl: string;
  submissionCategory: string;
  juryScores: any[];
  votingStats?: {
    juryVoteCount: number;
    juryScoreAverage: number;
  };
}

export default function JurySubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams?.get('status') || 'all');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      const res = await fetch(`/api/jury/submissions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isScored = (submission: Submission) => submission.juryScores.length > 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submissions to Score</h1>
        <p className="text-muted-foreground">Evaluate competition entries using the marking scheme</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submissions</SelectItem>
            <SelectItem value="not-scored">Not Scored</SelectItem>
            <SelectItem value="scored">Already Scored</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Submissions Grid */}
      {submissions.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            {filter === 'not-scored' ? (
              <div>
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-medium">All Caught Up!</p>
                <p className="text-sm mt-2">You've scored all available submissions.</p>
              </div>
            ) : (
              <div>
                <Clock className="h-16 w-16 mx-auto mb-4" />
                <p>No submissions found</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => {
            const scored = isScored(submission);
            return (
              <Card
                key={submission.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/jury/score/${submission.registrationNumber}`)}
              >
                {/* Image */}
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={submission.keyPhotographUrl}
                    alt={submission.title}
                    fill
                    className="object-cover"
                  />
                  {scored && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Scored
                      </Badge>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">{submission.submissionCategory}</Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground">
                      {submission.registrationNumber}
                    </p>
                    <h3 className="font-semibold text-lg line-clamp-1">{submission.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {submission.description}
                  </p>
                  <Button className="w-full" variant={scored ? 'outline' : 'default'}>
                    <Eye className="h-4 w-4 mr-2" />
                    {scored ? 'View Score' : 'Score Now'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
