import * as FormField from 'front-end/lib/components/form-field';
import * as RichMarkdownEditor from 'front-end/lib/components/form-field/rich-markdown-editor';
import { ComponentViewProps, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import Accordion from 'front-end/lib/views/accordion';
import Separator from 'front-end/lib/views/separator';
import { find } from 'lodash';
import React from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { SWUTeamQuestion } from 'shared/lib/resources/opportunity/sprint-with-us';
import { CreateSWUProposalTeamQuestionResponseBody, CreateSWUProposalTeamQuestionResponseValidationErrors, SWUProposalTeamQuestionResponse } from 'shared/lib/resources/proposal/sprint-with-us';
import { adt, ADT } from 'shared/lib/types';
import * as proposalValidation from 'shared/lib/validation/proposal/sprint-with-us';

interface ResponseState {
  isAccordianOpen: boolean;
  question: SWUTeamQuestion;
  response: Immutable<RichMarkdownEditor.State>;
}

export interface State {
  responses: ResponseState[];
}

export type Msg
  = ADT<'toggleAccordion', number>
  | ADT<'response', [number, RichMarkdownEditor.Msg]>;

export interface Params {
  questions: SWUTeamQuestion[];
  responses: SWUProposalTeamQuestionResponse[];
}

export const init: Init<Params, State> = async ({ questions, responses }) => {
  return {
    responses: await Promise.all([...questions]
      .sort((a, b) => {
        if (a.order < b.order) {
          return -1;
        } else if (a.order > b.order) {
          return 1;
        } else {
          return 0;
        }
      })
      .map(async question => ({
        isAccordianOpen: false,
        question,
        response: immutable(await RichMarkdownEditor.init({
          errors: [],
          validate: v => proposalValidation.validateSWUProposalTeamQuestionResponseResponse(v, question.wordLimit),
          child: {
            value: find(responses, { order: question.order })?.response || '',
            id: `swu-proposal-team-question-response-${question.order}`,
            uploadImage: api.makeUploadMarkdownImage()
          }
        }))
      })))
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'toggleAccordion':
      return [state.update('responses', rs => rs.map((r, i) => {
        return i === msg.value
          ? { ...r, isAccordianOpen: !r.isAccordianOpen }
          : r;
      }))];

    case 'response':
      return updateComponentChild({
        state,
        childStatePath: ['responses', String(msg.value[0]), 'response'],
        childUpdate: RichMarkdownEditor.update,
        childMsg: msg.value[1],
        mapChildMsg: value => adt('response', [msg.value[0], value]) as Msg
      });
  }
};

export type Values = CreateSWUProposalTeamQuestionResponseBody[];

export function getValues(state: Immutable<State>): Values {
  return state.responses.map(r => ({
    response: FormField.getValue(r.response),
    order: r.question.order
  }));
}

export type Errors = CreateSWUProposalTeamQuestionResponseValidationErrors[];

export function setErrors(state: Immutable<State>, errors: Errors = []): Immutable<State> {
  return errors.reduce((acc, e, i) => {
    return state
      .updateIn(['responses', i, 'response'], s => FormField.setErrors(s, e.response || []));
  }, state);
}

export function isValid(state: Immutable<State>): boolean {
  return state.responses.reduce((acc, r) => {
    return acc
        && FormField.isValid(r.response);
  }, true as boolean);
}

interface ResponseViewProps {
  index: number;
  response: ResponseState;
  disabled?: boolean;
  dispatch: Dispatch<Msg>;
}

const ResponseView: View<ResponseViewProps> = props => {
  const { response, dispatch, index, disabled } = props;
  const title = `Question ${index + 1}`;
  return (
    <Accordion
      className={''}
      toggle={() => dispatch(adt('toggleAccordion', index))}
      color='blue-dark'
      title={title}
      titleClassName='h3 mb-0'
      chevronWidth={1.5}
      chevronHeight={1.5}
      open={response.isAccordianOpen}>
      <p>{response.question.question}</p>
      <div className='mb-3 small text-secondary'>
        {response.question.wordLimit} word limit
        <Separator spacing='2' color='secondary' className='d-none d-md-block'>|</Separator>
        Scored out of ${response.question.score}
      </div>
      <Alert color='primary' fade={false} className='mb-4'>
        {response.question.guideline}
      </Alert>
      <RichMarkdownEditor.view
        extraChildProps={{}}
        required
        label={`${title} Response`}
        placeholder={`${title} Response`}
        style={{ height: '60vh', minHeight: '400px' }}
        disabled={disabled}
        state={response.response}
        dispatch={mapComponentDispatch(dispatch, value => adt('response', [index, value]) as Msg)} />
    </Accordion>
  );
};

interface Props extends ComponentViewProps<State, Msg> {
  disabled?: boolean;
}

export const view: View<Props> = props => {
  const { state, disabled } = props;
  return (
    <div>
      {state.responses.map((response, i) => (
        <Row key={`swu-proposal-team-question-response-${i}`}>
          <Col xs='12'>
            <ResponseView
              index={i}
              disabled={disabled}
              response={response}
              dispatch={props.dispatch}
            />
          </Col>
        </Row>
      ))}
    </div>
  );
};