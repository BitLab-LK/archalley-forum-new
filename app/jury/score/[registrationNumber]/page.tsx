"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { MARKING_SCHEME } from '@/types/jury';

export default function JuryScoringPage() {
  const router = useRouter();
  const params = useParams();
  const registrationNumber = params?.registrationNumber as string;

  const [submission, setSubmission] = useState<any>(null);
  const [existingScore, setExistingScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Scoring state
  const [scores, setScores] = useState({
    conceptScore: 0,
    relevanceScore: 0,
    compositionScore: 0,
    balanceScore: 0,
    colourScore: 0,
    designRelativityScore: 0,
    aestheticAppealScore: 0,
    unconventionalMaterialsScore: 0,
    overallMaterialScore: 0,
    comments: '',
  });

  useEffect(() => {
    if (registrationNumber) {
      fetchSubmission();
    }
  }, [registrationNumber]);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/jury/score/${registrationNumber}`);
      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);
        if (data.score) {
          setExistingScore(data.score);
          setScores({
            conceptScore: data.score.conceptScore,
            relevanceScore: data.score.relevanceScore,
            compositionScore: data.score.compositionScore,
            balanceScore: data.score.balanceScore,
            colourScore: data.score.colourScore,
            designRelativityScore: data.score.designRelativityScore,
            aestheticAppealScore: data.score.aestheticAppealScore,
            unconventionalMaterialsScore: data.score.unconventionalMaterialsScore,
            overallMaterialScore: data.score.overallMaterialScore,
            comments: data.score.comments || '',
          });
        }
      } else {
        toast.error('Failed to load submission');
        router.back();
      }
    } catch (error) {
      toast.error('Error loading submission');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return (
      scores.conceptScore +
      scores.relevanceScore +
      scores.compositionScore +
      scores.balanceScore +
      scores.colourScore +
      scores.designRelativityScore +
      scores.aestheticAppealScore +
      scores.unconventionalMaterialsScore +
      scores.overallMaterialScore
    );
  };

  const handleSubmit = async () => {
    const total = calculateTotal();
    if (total === 0) {
      toast.error('Please provide scores before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jury/score/${registrationNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scores),
      });

      if (res.ok) {
        toast.success('Score submitted successfully!');
        router.push('/jury/submissions');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit score');
      }
    } catch (error) {
      toast.error('Error submitting score');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Submission not found</div>
      </div>
    );
  }

  const totalScore = calculateTotal();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Submissions
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Score Submission</h1>
            <p className="text-muted-foreground">{submission.registrationNumber}</p>
          </div>
          {existingScore && (
            <Badge className="bg-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Already Scored
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Submission Preview */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={submission.keyPhotographUrl}
                  alt={submission.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div>
                <Badge variant="secondary" className="mb-2">
                  {submission.submissionCategory}
                </Badge>
                <h3 className="font-semibold text-lg">{submission.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {submission.description}
                </p>
              </div>

              {/* Additional Photos */}
              {submission.additionalPhotographs?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Additional Photos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {submission.additionalPhotographs.slice(0, 4).map((photo: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image src={photo} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {submission.documentFileUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={submission.documentFileUrl} target="_blank" rel="noopener noreferrer">
                    View Document (PDF)
                  </a>
                </Button>
              )}
              {submission.videoFileUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={submission.videoFileUrl} target="_blank" rel="noopener noreferrer">
                    View Video
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Scoring Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Marking Scheme</CardTitle>
              <CardDescription>Rate each criterion according to the marking guidelines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Score Display */}
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Total Score</span>
                  <span className="text-3xl font-bold text-blue-900">
                    {totalScore} <span className="text-xl">/ 100</span>
                  </span>
                </div>
              </div>

              {/* Marking Scheme Categories */}
              {MARKING_SCHEME.map((category) => (
                <div key={category.name} className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.weight}% of total score</p>
                  </div>

                  {category.criteria.map((criterion) => {
                    const currentValue = scores[criterion.field];
                    return (
                      <div key={criterion.field} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">{criterion.label}</Label>
                          <Badge variant="outline">
                            {currentValue} / {criterion.maxScore}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{criterion.description}</p>
                        <input
                          type="range"
                          value={currentValue}
                          onChange={(e) =>
                            setScores({ ...scores, [criterion.field]: parseFloat(e.target.value) })
                          }
                          min={0}
                          max={criterion.maxScore}
                          step={0.5}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer my-4 accent-blue-600"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Comments */}
              <div className="space-y-2">
                <Label>Additional Comments (Optional)</Label>
                <Textarea
                  placeholder="Provide additional feedback or notes..."
                  value={scores.comments}
                  onChange={(e) => setScores({ ...scores, comments: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || totalScore === 0}
                  size="lg"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {existingScore ? 'Update Score' : 'Submit Score'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
