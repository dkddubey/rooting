export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  originPlaces?: string[] | null;
  createdAt: Date;
}

export interface AncestorData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  maidenName?: string | null;
  gender: string;
  birthYear?: number | null;
  deathYear?: number | null;
  birthPlace?: string | null;
  deathPlace?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  spouseId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchReasonMetrics {
  nameSimilarity: number;     // 0.0 - 1.0
  phoneticMatch: boolean;
  soundexMatch: boolean;
  metaphoneMatch: boolean;
  soundex1: string;
  soundex2: string;
  metaphone1: string;
  metaphone2: string;
  birthPlaceMatch: number;    // 0.0 - 1.0
  yearDelta: number | null;
  yearScore: number;          // 0.0 - 1.0
  overallScore: number;       // 0 - 100
}

export interface KinshipResult {
  commonAncestorId: string | null;
  commonAncestorName: string | null;
  commonAncestorBirthYear: number | null;
  depthUser1: number;
  depthUser2: number;
  totalDistance: number;
  kinshipRelationship: string;
  pathUser1: Array<{ id: string; name: string; relation: string }>;
  pathUser2: Array<{ id: string; name: string; relation: string }>;
}

