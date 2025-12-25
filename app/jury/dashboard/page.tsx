"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Clock, TrendingUp, ArrowRight } from 'lucide-react';

interface DashboardStats {
  juryMember: {
    id: string;
    title: string;
    user: {
      name: string;
      email: string;
      image?: string;
    };
  };
  progress: {
    totalAssignedEntries: number;
    submittedScores: number;
    completionPercentage: number;
    averageScoreGiven: number | null;
    lastScoredAt: string | null;
  };
}

export default function JuryDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/jury/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Not authorized</div>
      </div>
    );
  }

  const remaining = stats.progress.totalAssignedEntries - stats.progress.submittedScores;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Jury Portal</h1>
        <p className="text-muted-foreground mt-1">
          Welcome, {stats.juryMember.user.name} ({stats.juryMember.title})
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle>Your Scoring Progress</CardTitle>
          <CardDescription>Track your evaluation progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">
                  {stats.progress.submittedScores} of {stats.progress.totalAssignedEntries} entries scored
                </span>
                <span className="font-medium">
                  {Math.round(stats.progress.completionPercentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${stats.progress.completionPercentage}%` }}
                />
              </div>
            </div>
            {remaining > 0 && (
              <p className="text-sm text-muted-foreground">
                {remaining} submission{remaining > 1 ? 's' : ''} remaining to score
              </p>
            )}
            {stats.progress.completionPercentage === 100 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  🎉 Congratulations! You've completed scoring all submissions.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.progress.totalAssignedEntries}</div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Assigned for evaluation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scores Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {stats.progress.submittedScores}
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Successfully evaluated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats.progress.averageScoreGiven
                  ? `${stats.progress.averageScoreGiven.toFixed(1)}/100`
                  : '-'}
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.progress.lastScoredAt
                ? `Last scored ${new Date(stats.progress.lastScoredAt).toLocaleDateString()}`
                : 'No scores yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/jury/submissions?status=not-scored')}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Start Scoring
              <ArrowRight className="h-5 w-5" />
            </CardTitle>
            <CardDescription>View submissions waiting for your evaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{remaining}</div>
            <p className="text-sm text-muted-foreground mt-2">Not yet scored</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/jury/submissions?status=scored')}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Review Your Scores
              <ArrowRight className="h-5 w-5" />
            </CardTitle>
            <CardDescription>View submissions you've already evaluated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{stats.progress.submittedScores}</div>
            <p className="text-sm text-muted-foreground mt-2">Already scored</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Button size="lg" onClick={() => router.push('/jury/submissions')}>
          View All Submissions
        </Button>
      </div>
    </div>
  );
}
