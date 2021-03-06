import { generateUuid } from 'back-end/lib';
import { setDateTo4PM } from 'shared/lib';
import { Affiliation, MembershipStatus, MembershipType } from 'shared/lib/resources/affiliation';
import { CWUOpportunity, CWUOpportunitySlim, CWUOpportunityStatus } from 'shared/lib/resources/opportunity/code-with-us';
import { SWUOpportunity, SWUOpportunityPhase, SWUOpportunityPhaseRequiredCapability, SWUOpportunityPhaseType, SWUOpportunitySlim, SWUOpportunityStatus, SWUTeamQuestion } from 'shared/lib/resources/opportunity/sprint-with-us';
import { Organization, OrganizationSlim } from 'shared/lib/resources/organization';
import { CWUIndividualProponent, CWUProposal, CWUProposalStatus } from 'shared/lib/resources/proposal/code-with-us';
import { SWUProposal, SWUProposalStatus, SWUProposalTeamQuestionResponse } from 'shared/lib/resources/proposal/sprint-with-us';
import { User, UserSlim, UserStatus, UserType } from 'shared/lib/resources/user';
import { adt } from 'shared/lib/types';

export const id = generateUuid();
export const date = setDateTo4PM(new Date());
export const email = 'user@example.com';

export const vendorUser: User = {
  id,
  type: UserType.Vendor,
  status: UserStatus.Active,
  name: 'Vendor User',
  email,
  jobTitle: '',
  avatarImageFile: null,
  notificationsOn: null,
  acceptedTerms: null,
  idpUsername: 'vendor_user',
  deactivatedOn: null,
  deactivatedBy: null,
  capabilities: []
};

export const vendorUserSlim: UserSlim = {
  id: vendorUser.id,
  name: vendorUser.name
};

export const govUser: User = {
  id,
  type: UserType.Government,
  status: UserStatus.Active,
  name: 'Government User',
  email,
  jobTitle: 'Job Title',
  avatarImageFile: null,
  notificationsOn: null,
  acceptedTerms: null,
  idpUsername: 'username',
  deactivatedOn: null,
  deactivatedBy: null,
  capabilities: []
};

export const adminUser: User = {
  id,
  type: UserType.Admin,
  status: UserStatus.Active,
  name: 'Admin User',
  email,
  jobTitle: 'Job Title',
  avatarImageFile: null,
  notificationsOn: null,
  acceptedTerms: null,
  idpUsername: 'username',
  deactivatedOn: null,
  deactivatedBy: null,
  capabilities: []
};

export const cwuOpportunity: CWUOpportunity = {
  id,
  createdAt: date,
  updatedAt: date,
  title: 'CWU Title',
  teaser: '',
  remoteOk: true,
  remoteDesc: '',
  location: 'Location',
  reward: 70000,
  skills: ['Skill'],
  description: 'Description',
  proposalDeadline: date,
  assignmentDate: date,
  startDate: date,
  completionDate: null,
  submissionInfo: '',
  acceptanceCriteria: '',
  evaluationCriteria: '',
  successfulProponentName: 'Successful Proponent',
  status: CWUOpportunityStatus.Published,
  attachments: [],
  addenda: []
};

export const publishedCWUOpportunity: CWUOpportunity = {
  ...cwuOpportunity,
  publishedAt: date
};

export const cwuOpportunitySlim: CWUOpportunitySlim = {
  id: cwuOpportunity.id,
  title: cwuOpportunity.title,
  teaser: cwuOpportunity.teaser,
  remoteOk: cwuOpportunity.remoteOk,
  location: cwuOpportunity.location,
  reward: cwuOpportunity.reward,
  createdAt: cwuOpportunity.createdAt,
  updatedAt: cwuOpportunity.updatedAt,
  status: cwuOpportunity.status,
  proposalDeadline: cwuOpportunity.proposalDeadline
};

export const cwuIndividualProponent: CWUIndividualProponent = {
  id,
  legalName: 'Legal Name',
  email,
  phone: '(555) 555-5555',
  street1: 'Street 1',
  street2: 'Street 2',
  city: 'City',
  region: 'Region',
  mailCode: 'Mail Code',
  country: 'Country'
};

export const cwuProposal: CWUProposal = {
  id,
  createdBy: vendorUserSlim,
  createdAt: date,
  updatedBy: vendorUserSlim,
  updatedAt: date,
  opportunity: cwuOpportunitySlim,
  proposalText: 'Proposal Text',
  additionalComments: 'Additional Comments',
  proponent: adt('individual', cwuIndividualProponent),
  status: CWUProposalStatus.Submitted,
  attachments: []
};

export const swuOpportunityRequiredCapability: SWUOpportunityPhaseRequiredCapability = {
  capability: 'Capability',
  fullTime: true,
  createdAt: date
};

export const swuOpportunityImplementationPhase: SWUOpportunityPhase = {
  phase: SWUOpportunityPhaseType.Implementation,
  startDate: date,
  completionDate: date,
  maxBudget: 1500000,
  createdAt: date,
  requiredCapabilities: [swuOpportunityRequiredCapability]
};

export const swuOpportunityTeamQuestion: SWUTeamQuestion = {
  question: 'Question',
  guideline: 'Guideline',
  score: 5,
  wordLimit: 300,
  order: 1,
  createdAt: date
};

export const swuOpportunity: SWUOpportunity = {
  id,
  createdAt: date,
  updatedAt: date,
  title: 'SWU Title',
  teaser: '',
  remoteOk: true,
  remoteDesc: '',
  location: 'Location',
  totalMaxBudget: 2000000,
  minTeamMembers: 3,
  mandatorySkills: ['Mandatory Skill'],
  optionalSkills: [],
  description: 'Description',
  proposalDeadline: date,
  assignmentDate: date,
  questionsWeight: 20,
  codeChallengeWeight: 30,
  scenarioWeight: 30,
  priceWeight: 20,
  status: SWUOpportunityStatus.Published,
  implementationPhase: swuOpportunityImplementationPhase,
  teamQuestions: [swuOpportunityTeamQuestion],
  successfulProponentName: 'Successful Proponent',
  attachments: [],
  addenda: []
};

export const publishedSWUOpportunity: SWUOpportunity = {
  ...swuOpportunity,
  publishedAt: date
};

export const swuOpportunitySlim: SWUOpportunitySlim = {
  id: swuOpportunity.id,
  title: swuOpportunity.title,
  teaser: swuOpportunity.teaser,
  remoteOk: swuOpportunity.remoteOk,
  location: swuOpportunity.location,
  totalMaxBudget: swuOpportunity.totalMaxBudget,
  createdAt: swuOpportunity.createdAt,
  updatedAt: swuOpportunity.updatedAt,
  status: swuOpportunity.status,
  proposalDeadline: swuOpportunity.proposalDeadline
};

export const organization: Organization = {
  id,
  createdAt: date,
  updatedAt: date,
  legalName: 'Organization',
  streetAddress1: 'Street Address 1',
  streetAddress2: 'Street Address 2',
  city: 'City',
  region: 'Region',
  mailCode: 'Mail Code',
  country: 'Country',
  contactName: 'Contact Name',
  contactEmail: 'Contact Email',
  contactTitle: 'Contact Title',
  contactPhone: 'Contact Phone',
  websiteUrl: 'Website',
  active: true
};

export const organizatonSlim: OrganizationSlim = {
  id,
  legalName: 'Organization Legal Name',
  active: true
};

export const swuProposalTeamQuestionResponse: SWUProposalTeamQuestionResponse = {
  response: 'Response',
  order: 1
};

export const swuProposal: SWUProposal = {
  id,
  createdAt: date,
  updatedAt: date,
  status: SWUProposalStatus.Submitted,
  opportunity: swuOpportunitySlim,
  organization: organizatonSlim,
  teamQuestionResponses: [swuProposalTeamQuestionResponse],
  anonymousProponentName: 'Proponent 1'
};

export const affiliation: Affiliation = {
  id,
  createdAt: date,
  user: vendorUser,
  organization,
  membershipType: MembershipType.Member,
  membershipStatus: MembershipStatus.Active
};
