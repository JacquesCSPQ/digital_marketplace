import { CrudApi, makeCreate, makeCrudApi, makeReadMany, makeRequest, makeSimpleCrudApi, OmitCrudApi, PickCrudApi, SimpleResourceTypes, undefinedActions, UndefinedResourceTypes } from 'front-end/lib/http/crud';
import * as AffiliationResource from 'shared/lib/resources/affiliation';
import * as FileResource from 'shared/lib/resources/file';
import * as OrgResource from 'shared/lib/resources/organization';
import * as SessionResource from 'shared/lib/resources/session';
import * as UserResource from 'shared/lib/resources/user';
import { ClientHttpMethod } from 'shared/lib/types';

export { getValid, getInvalid, ResponseValidation, isValid, isInvalid, isUnhandled } from 'shared/lib/http';

const deslash = (s: string) => s.replace(/^\/*/, '').replace(/\/*$/, '');
const prefix = (a: string) => (b: string) => `/${deslash(a)}/${deslash(b)}`;
const apiNamespace = prefix('api');

// Markdown files.

interface GetMarkdownFileActionTypes {
  request: undefined;
  rawResponse: never;
  validResponse: string;
  invalidResponse: null;
}

export const getMarkdownFile = (id: string) => makeRequest<GetMarkdownFileActionTypes>({
  method: ClientHttpMethod.Get,
  url: `/markdown/${id}.md`,
  body: undefined
});

// Sessions

interface SessionSimpleResourceTypesParams {
  record: SessionResource.Session;
  create: {
    request: null;
    invalidResponse: null;
  };
  update: {
    request: null;
    invalidResponse: null;
  };
}

type SessionSimpleResourceTypes = SimpleResourceTypes<SessionSimpleResourceTypesParams>;

type SessionResourceTypes = PickCrudApi<SessionSimpleResourceTypes, 'readOne' | 'delete'>;

export const sessions: CrudApi<SessionResourceTypes> = {
  ...makeSimpleCrudApi<SessionSimpleResourceTypesParams>(apiNamespace('sessions')),
  create: undefined,
  readMany: undefined,
  update: undefined
};

// Users

interface UserSimpleResourceTypesParams {
  record: UserResource.User;
  create: {
    request: null;
    invalidResponse: null;
  };
  update: {
    request: UserResource.UpdateRequestBody;
    invalidResponse: UserResource.UpdateValidationErrors;
  };
}

type UserSimpleResourceTypes = SimpleResourceTypes<UserSimpleResourceTypesParams>;

type UserResourceTypes = OmitCrudApi<UserSimpleResourceTypes, 'create'>;

export const users: CrudApi<UserResourceTypes> = {
  ...makeSimpleCrudApi<UserSimpleResourceTypesParams>(apiNamespace('users')),
  create: undefined
};

// Organizations

interface OrganizationSimpleResourceTypesParams {
  record: OrgResource.Organization;
  create: {
    request: OrgResource.CreateRequestBody;
    invalidResponse: OrgResource.CreateValidationErrors;
  };
  update: {
    request: OrgResource.UpdateRequestBody;
    invalidResponse: OrgResource.UpdateValidationErrors;
  };
}

interface OrganizationResourceTypes extends Omit<SimpleResourceTypes<OrganizationSimpleResourceTypesParams>, 'readMany'> {
  readMany: {
    rawResponse: OrgResource.OrganizationSlim;
    validResponse: OrgResource.OrganizationSlim;
    invalidResponse: string[];
  };
}

const ORGANIZATIONS_ROUTE_NAMESPACE = apiNamespace('organizations');

export const organizations: CrudApi<OrganizationResourceTypes> = {
  ...makeSimpleCrudApi<OrganizationSimpleResourceTypesParams>(ORGANIZATIONS_ROUTE_NAMESPACE),
  readMany: makeReadMany<OrganizationResourceTypes['readMany']>({
    routeNamespace: ORGANIZATIONS_ROUTE_NAMESPACE
  })
};

// Affiliations

interface RawAffiliation extends Omit<AffiliationResource.Affiliation, 'createdAt'> {
  createdAt: string;
}

function rawAffiliationToAffiliation(raw: RawAffiliation): AffiliationResource.Affiliation {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt)
  };
}

interface AffiliationResourceTypes extends Pick<UndefinedResourceTypes, 'readOne'> {
  create: {
    request: AffiliationResource.CreateRequestBody;
    rawResponse: RawAffiliation;
    validResponse: AffiliationResource.Affiliation;
    invalidResponse: AffiliationResource.CreateValidationErrors;
  };
  readMany: {
    rawResponse: AffiliationResource.AffiliationSlim;
    validResponse: AffiliationResource.AffiliationSlim;
    invalidResponse: string[];
  };
  update: {
    request: null;
    rawResponse: RawAffiliation;
    validResponse: AffiliationResource.Affiliation;
    invalidResponse: AffiliationResource.UpdateValidationErrors;
  };
  delete: {
    rawResponse: RawAffiliation;
    validResponse: AffiliationResource.Affiliation;
    invalidResponse: AffiliationResource.DeleteValidationErrors;
  };
}

const affiliationActionParams = {
  transformValid: rawAffiliationToAffiliation
};

export const affiliations: CrudApi<AffiliationResourceTypes> = makeCrudApi({
  routeNamespace: apiNamespace('affiliations'),
  create: affiliationActionParams,
  update: affiliationActionParams,
  delete: affiliationActionParams,
  readMany: {
    transformValid: a => a
  },
  readOne: undefined
});

// Files

interface RawFileRecord extends Omit<FileResource.FileRecord, 'createdAt'> {
  createdAt: string;
}

function rawFileRecordToFileRecord(raw: RawFileRecord): FileResource.FileRecord {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt)
  };
}

interface CreateFileRequestBody {
  name: string;
  file: File;
  metadata: FileResource.FileUploadMetadata;
}

interface FileResourceTypes extends Omit<UndefinedResourceTypes, 'create' | 'readOne'> {
  create: {
    request: CreateFileRequestBody;
    rawResponse: RawFileRecord;
    validResponse: FileResource.FileRecord;
    invalidResponse: FileResource.CreateValidationErrors;
  };
  readOne: {
    rawResponse: RawFileRecord;
    validResponse: FileResource.FileRecord;
    invalidResponse: string[];
  };
}

const FILES_ROUTE_NAMESPACE = apiNamespace('files');

const fileCrudApi = makeCrudApi<Omit<FileResourceTypes, 'create'> & { create: undefined }>({
  ...undefinedActions,
  routeNamespace: FILES_ROUTE_NAMESPACE,
  readOne: {
    transformValid: rawFileRecordToFileRecord
  }
});

export const files: CrudApi<FileResourceTypes> = {
  ...fileCrudApi,
  create: body => {
    const multipartBody = new FormData();
    multipartBody.append('name', body.name);
    multipartBody.append('file', body.file);
    multipartBody.append('metadata', JSON.stringify(body.metadata));
    return makeCreate<Omit<FileResourceTypes['create'], 'request'> & { request: FormData }>({
      routeNamespace: FILES_ROUTE_NAMESPACE,
      transformValid: rawFileRecordToFileRecord
    })(multipartBody);
  }
};
