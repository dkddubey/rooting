export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  originPlaces?: string[];
}

export interface Ancestor {
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
  father?: { id: string; firstName: string; lastName: string } | null;
  mother?: { id: string; firstName: string; lastName: string } | null;
  spouse?: { id: string; firstName: string; lastName: string } | null;
  generation?: number;
}

export interface MatchMetrics {
  nameSimilarity: number;
  phoneticMatch: boolean;
  soundexMatch: boolean;
  metaphoneMatch: boolean;
  soundex1: string;
  soundex2: string;
  metaphone1: string;
  metaphone2: string;
  birthPlaceMatch: number;
  yearDelta: number | null;
  yearScore: number;
  overallScore: number;
}

export interface AncestorMatchItem {
  id: string;
  score: number;
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED';
  myAncestor: Ancestor;
  matchedAncestor: Ancestor;
  otherUser: { id: string; name: string; email: string; bio?: string };
  metrics: MatchMetrics;
  createdAt: string;
}

export interface UserConnectionItem {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  relationType: 'RELATIVE' | 'FRIEND';
  kinshipTitle?: string | null;
  commonAncestorId?: string | null;
  isRequester: boolean;
  otherUser: { id: string; name: string; email: string; bio?: string };
  createdAt: string;
}

export interface KinshipPathItem {
  id: string;
  name: string;
  relation: string;
}

export interface KinshipDetails {
  commonAncestorId: string | null;
  commonAncestorName: string | null;
  commonAncestorBirthYear: number | null;
  depthUser1: number;
  depthUser2: number;
  totalDistance: number;
  kinshipRelationship: string;
  pathUser1: KinshipPathItem[];
  pathUser2: KinshipPathItem[];
}

