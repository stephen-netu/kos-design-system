// Grove & Accord domain types for the LEAP design system

export type TrustState = 'provisional' | 'trusted' | 'vouched' | 'banned';

export type GovernanceMode = 'leader' | 'peer' | 'role_based';

export interface MemberInfo {
  realmId: string;
  name: string;
  trustState: TrustState;
  isCoordinator: boolean;
}

export interface GroveInfo {
  groveId: string;
  governance: GovernanceMode;
  memberCount: number;
  coordinatorName?: string;
  isJoined: boolean;
  epoch: number;
}

export interface AccordInfo {
  accordId: string;
  domains: string[];
  participantCount: number;
  expiresAt: number;
  groveId?: string;
}
