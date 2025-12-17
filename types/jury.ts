// ============================================
// JURY SYSTEM TYPES
// ============================================

export interface JuryMember {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  competitionId: string | null;
  assignedAt: Date;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JuryScore {
  id: string;
  juryMemberId: string;
  registrationNumber: string;
  
  // Marking scheme (100 points total)
  conceptScore: number; // 0-10
  relevanceScore: number; // 0-15
  compositionScore: number; // 0-10
  balanceScore: number; // 0-10
  colourScore: number; // 0-10
  designRelativityScore: number; // 0-10
  aestheticAppealScore: number; // 0-20
  unconventionalMaterialsScore: number; // 0-10
  overallMaterialScore: number; // 0-5
  
  totalScore: number; // 0-100 (calculated)
  comments: string | null;
  
  createdAt: Date;
  submittedAt: Date;
}

export interface JuryScoringProgress {
  id: string;
  juryMemberId: string;
  totalAssignedEntries: number;
  submittedScores: number;
  completionPercentage: number;
  averageScoreGiven: number | null;
  lastScoredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarkingSchemeCategory {
  name: string;
  weight: number;
  criteria: MarkingSchemeCriterion[];
}

export interface MarkingSchemeCriterion {
  label: string;
  field: keyof JuryScoreInput;
  maxScore: number;
  description: string;
}

export interface JuryScoreInput {
  conceptScore: number;
  relevanceScore: number;
  compositionScore: number;
  balanceScore: number;
  colourScore: number;
  designRelativityScore: number;
  aestheticAppealScore: number;
  unconventionalMaterialsScore: number;
  overallMaterialScore: number;
  comments?: string;
}

// Marking scheme structure for UI
export const MARKING_SCHEME: MarkingSchemeCategory[] = [
  {
    name: 'Concept',
    weight: 10,
    criteria: [
      {
        label: 'Concept strongness & its depth',
        field: 'conceptScore',
        maxScore: 10,
        description: 'Evaluate the strength and depth of the concept',
      },
    ],
  },
  {
    name: 'Relevance to Competition Theme',
    weight: 15,
    criteria: [
      {
        label: 'Futuristic approach / concept / look',
        field: 'relevanceScore',
        maxScore: 15,
        description: 'How well does it align with a futuristic theme',
      },
    ],
  },
  {
    name: 'Design & Aesthetics',
    weight: 60,
    criteria: [
      {
        label: 'Composition',
        field: 'compositionScore',
        maxScore: 10,
        description: 'Overall composition and layout',
      },
      {
        label: 'Balance',
        field: 'balanceScore',
        maxScore: 10,
        description: 'Visual balance and harmony',
      },
      {
        label: 'Colour/Colours',
        field: 'colourScore',
        maxScore: 10,
        description: 'Use of color and color palette',
      },
      {
        label: 'Design Relativity to their concept',
        field: 'designRelativityScore',
        maxScore: 10,
        description: 'How well the design relates to the concept',
      },
      {
        label: 'Aesthetic appeal',
        field: 'aestheticAppealScore',
        maxScore: 20,
        description: 'Overall aesthetic quality and appeal',
      },
    ],
  },
  {
    name: 'Innovative Usage of Materials',
    weight: 15,
    criteria: [
      {
        label: 'Usage of unconventional materials',
        field: 'unconventionalMaterialsScore',
        maxScore: 10,
        description: 'Creativity in material selection',
      },
      {
        label: 'Overall material usage',
        field: 'overallMaterialScore',
        maxScore: 5,
        description: 'Overall material application and execution',
      },
    ],
  },
];
