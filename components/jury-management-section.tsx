"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface JuryMember {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  progress?: {
    totalAssignedEntries: number;
    submittedScores: number;
    completionPercentage: number;
    averageScoreGiven?: number;
    lastScoredAt?: string;
  };
  _count?: {
    scores: number;
  };
}

export default function JuryManagementSection() {
  const [juryMembers, setJuryMembers] = useState<JuryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedJury, setSelectedJury] = useState<JuryMember | null>(null);
  
  // Add jury form state
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [newJuryTitle, setNewJuryTitle] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchJuryMembers();
  }, []);

  const fetchJuryMembers = async () => {
    try {
      const res = await fetch('/api/admin/jury');
      const data = await res.json();
      if (res.ok) {
        setJuryMembers(data.juryMembers || []);
      } else {
        toast.error('Failed to load jury members');
      }
    } catch (error) {
      toast.error('Error loading jury members');
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/admin/jury/search-users?email=${encodeURIComponent(searchEmail)}`);
      const data = await res.json();
      
      if (res.ok) {
        if (data.isAlreadyJury) {
          toast.error('This user is already a jury member');
          setFoundUser(null);
        } else {
          setFoundUser(data.user);
          toast.success('User found! Please enter their title.');
        }
      } else {
        toast.error(data.error || 'User not found');
        setFoundUser(null);
      }
    } catch (error) {
      toast.error('Error searching for user');
      setFoundUser(null);
    } finally {
      setSearching(false);
    }
  };

  const addJuryMember = async () => {
    if (!foundUser || !newJuryTitle.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/admin/jury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: foundUser.id,
          title: newJuryTitle,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(`${foundUser.name} added as jury member`);
        setAddDialogOpen(false);
        setSearchEmail('');
        setFoundUser(null);
        setNewJuryTitle('');
        fetchJuryMembers();
      } else {
        toast.error(data.error || 'Failed to add jury member');
      }
    } catch (error) {
      toast.error('Error adding jury member');
    } finally {
      setAdding(false);
    }
  };

  const updateJuryMember = async () => {
    if (!selectedJury || !selectedJury.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const res = await fetch(`/api/admin/jury/${selectedJury.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedJury.title,
          isActive: selectedJury.isActive,
        }),
      });

      if (res.ok) {
        toast.success('Jury member updated');
        setEditDialogOpen(false);
        fetchJuryMembers();
      } else {
        toast.error('Failed to update jury member');
      }
    } catch (error) {
      toast.error('Error updating jury member');
    }
  };

  const removeJuryMember = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} as jury member? Their scores will remain in the database.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/jury/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(`${name} removed as jury member`);
        fetchJuryMembers();
      } else {
        toast.error('Failed to remove jury member');
      }
    } catch (error) {
      toast.error('Error removing jury member');
    }
  };

  const toggleActive = async (jury: JuryMember) => {
    try {
      const res = await fetch(`/api/admin/jury/${jury.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !jury.isActive,
        }),
      });

      if (res.ok) {
        toast.success(`${jury.user.name} ${!jury.isActive ? 'activated' : 'deactivated'}`);
        fetchJuryMembers();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading jury members...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Jury Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage jury members and monitor their scoring progress
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Jury Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jury</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{juryMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Jury</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {juryMembers.filter((j) => j.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {juryMembers.length > 0
                ? Math.round(
                    juryMembers.reduce((sum, j) => sum + (j.progress?.completionPercentage || 0), 0) /
                      juryMembers.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {juryMembers.reduce((sum, j) => sum + (j._count?.scores || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jury Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Jury Members</CardTitle>
          <CardDescription>View and manage all jury members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {juryMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No jury members added yet. Click "Add Jury Member" to get started.
              </div>
            ) : (
              juryMembers.map((jury) => (
                <div
                  key={jury.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={jury.user.image} alt={jury.user.name} />
                      <AvatarFallback>{jury.user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{jury.user.name}</h3>
                        {jury.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{jury.title}</p>
                      <p className="text-xs text-muted-foreground">{jury.user.email}</p>
                    </div>

                    {/* Progress */}
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {jury.progress?.submittedScores || 0} / {jury.progress?.totalAssignedEntries || 0} scored
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(jury.progress?.completionPercentage || 0)}% complete
                      </div>
                      <div className="w-40 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${jury.progress?.completionPercentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Avg Score */}
                    <div className="text-center px-4">
                      <div className="text-sm font-medium">
                        {jury.progress?.averageScoreGiven
                          ? jury.progress.averageScoreGiven.toFixed(1)
                          : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Score</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJury(jury);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(jury)}>
                        {jury.isActive ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => removeJuryMember(jury.id, jury.user.name)}>
                        <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                        <span className="text-red-600">Remove</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Jury Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Jury Member</DialogTitle>
            <DialogDescription>Search for a user by email and add them as a jury member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Step 1: Search User */}
            <div className="space-y-2">
              <Label>Search User by Email</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="user@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                />
                <Button onClick={searchUser} disabled={searching}>
                  <Search className="h-4 w-4 mr-2" />
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {/* Step 2: Show Found User */}
            {foundUser && (
              <div className="p-4 border rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={foundUser.image} />
                    <AvatarFallback>{foundUser.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{foundUser.name}</p>
                    <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                    {foundUser.profession && (
                      <p className="text-xs text-muted-foreground">{foundUser.profession}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Enter Title */}
            {foundUser && (
              <div className="space-y-2">
                <Label>Professional Title *</Label>
                <Input
                  placeholder="e.g., Principal Architect, Design Director"
                  value={newJuryTitle}
                  onChange={(e) => setNewJuryTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed alongside their name
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  setSearchEmail('');
                  setFoundUser(null);
                  setNewJuryTitle('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={addJuryMember}
                disabled={!foundUser || !newJuryTitle.trim() || adding}
              >
                {adding ? 'Adding...' : 'Add as Jury Member'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Jury Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Jury Member</DialogTitle>
            <DialogDescription>Update jury member details</DialogDescription>
          </DialogHeader>
          {selectedJury && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Professional Title *</Label>
                <Input
                  value={selectedJury.title}
                  onChange={(e) =>
                    setSelectedJury({ ...selectedJury, title: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateJuryMember}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
