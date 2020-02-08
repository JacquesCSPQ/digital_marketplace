import { Addendum } from 'shared/lib/resources/addendum';
import { FileRecord } from 'shared/lib/resources/file';
import { User } from 'shared/lib/resources/user';
import { ADT, BodyWithErrors, Id } from 'shared/lib/types';
import { ErrorTypeFrom } from 'shared/lib/validation';

export enum CWUOpportunityStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Evaluation = 'EVALUATION',
  Awarded = 'AWARDED',
  Suspended = 'SUSPENDED',
  Canceled = 'CANCELED'
}

export interface CWUOpportunity {
  id: Id;
  createdAt: Date;
  updatedAt: Date;

  createdBy?: User;
  updatedBy?: User;

  title: string;
  teaser: string;
  remoteOk: boolean;
  remoteDesc: string;
  location: string;
  reward: number;
  skills: string[];
  description: string;
  proposalDeadline: Date;
  assignmentDate: Date;
  startDate: Date;
  completionDate: Date;
  submissionInfo: string;
  acceptanceCriteria: string;
  evaluationCriteria: string;
  status: CWUOpportunityStatus;
  attachments: FileRecord[];
  addenda: Addendum[];
}

export type CWUOpportunitySlim = Pick<CWUOpportunity, 'id' | 'title' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status' | 'proposalDeadline'>;

export interface CreateRequestBody {
  title: string;
  teaser: string;
  remoteOk: boolean;
  remoteDesc: string;
  location: string;
  reward: number;
  skills: string[];
  description: string;
  proposalDeadline: string;
  assignmentDate: string;
  startDate: string;
  completionDate: string;
  submissionInfo: string;
  acceptanceCriteria: string;
  evaluationCriteria: string;
  attachments: Id[];
}

export interface CreateValidationErrors extends Omit<ErrorTypeFrom<CreateRequestBody> & BodyWithErrors, 'skills' | 'attachments'> {
  skills?: string[][];
  attachments?: string[][];
}

export type UpdateRequestBody
  = ADT<'edit', UpdateEditRequestBody>
  | ADT<'publish', string>
  | ADT<'suspend', string>
  | ADT<'cancel', string>
  | ADT<'addAddendum', string>;

export type UpdateEditRequestBody = CreateRequestBody;

type UpdateADTErrors
  = ADT<'edit', UpdateEditValidationErrors>
  | ADT<'publish', string[]>
  | ADT<'suspend', string[]>
  | ADT<'cancel', string[]>
  | ADT<'addAddendum', string[]>
  | ADT<'parseFailure'>;

export interface UpdateValidationErrors extends BodyWithErrors {
  opportunity?: UpdateADTErrors;
  proposal?: string[];
}

export interface UpdateEditValidationErrors extends Omit<ErrorTypeFrom<UpdateEditRequestBody>, 'attachments' | 'skills'> {
  attachments?: string[][];
  skills?: string[][];
}

export type DeleteValidationErrors = BodyWithErrors;

export function isValidStatusChange(from: CWUOpportunityStatus, to: CWUOpportunityStatus): boolean {
  switch (from) {
    case CWUOpportunityStatus.Draft:
      return to === CWUOpportunityStatus.Published;
    case CWUOpportunityStatus.Published:
      return [CWUOpportunityStatus.Canceled, CWUOpportunityStatus.Suspended, CWUOpportunityStatus.Evaluation].includes(to);
    case CWUOpportunityStatus.Evaluation:
      return [CWUOpportunityStatus.Canceled, CWUOpportunityStatus.Suspended, CWUOpportunityStatus.Awarded].includes(to);
    case CWUOpportunityStatus.Suspended:
      return [CWUOpportunityStatus.Published, CWUOpportunityStatus.Canceled].includes(to);
    default:
      return false;
  }
}

export const publicOpportunityStatuses: readonly CWUOpportunityStatus[] = [CWUOpportunityStatus.Published, CWUOpportunityStatus.Evaluation, CWUOpportunityStatus.Awarded];

export const privateOpportunitiesStatuses: readonly CWUOpportunityStatus[] = [CWUOpportunityStatus.Draft, CWUOpportunityStatus.Canceled, CWUOpportunityStatus.Suspended];