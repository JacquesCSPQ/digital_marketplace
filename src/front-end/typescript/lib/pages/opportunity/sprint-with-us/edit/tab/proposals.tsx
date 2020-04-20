import { EMPTY_STRING } from 'front-end/config';
import { makeStartLoading, makeStopLoading } from 'front-end/lib';
import { Route } from 'front-end/lib/app/types';
import * as Table from 'front-end/lib/components/table';
import { ComponentView, Dispatch, GlobalComponentMsg, immutable, Immutable, Init,  mapComponentDispatch, newRoute, toast, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as Tab from 'front-end/lib/pages/opportunity/sprint-with-us/edit/tab';
import * as opportunityToasts from 'front-end/lib/pages/opportunity/sprint-with-us/lib/toasts';
import EditTabHeader from 'front-end/lib/pages/opportunity/sprint-with-us/lib/views/edit-tab-header';
import { swuProposalStatusToColor, swuProposalStatusToTitleCase } from 'front-end/lib/pages/proposal/sprint-with-us/lib';
import * as proposalToasts from 'front-end/lib/pages/proposal/sprint-with-us/lib/toasts';
import Badge from 'front-end/lib/views/badge';
import Link, { iconLinkSymbol, leftPlacement, rightPlacement, routeDest } from 'front-end/lib/views/link';
import ReportCardList, { ReportCard } from 'front-end/lib/views/report-card-list';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { compareNumbers } from 'shared/lib';
import { canSWUOpportunityBeScreenedInToCodeChallenge, canViewSWUOpportunityProposals, hasSWUOpportunityPassedTeamQuestions, SWUOpportunity, SWUOpportunityStatus } from 'shared/lib/resources/opportunity/sprint-with-us';
import { canSWUProposalBeScreenedToFromCodeChallenge, getSWUProponentName, NUM_SCORE_DECIMALS, SWUProposalSlim, SWUProposalStatus } from 'shared/lib/resources/proposal/sprint-with-us';
import { ADT, adt, Id } from 'shared/lib/types';

type ModalId
  = ADT<'screenInToCodeChallenge', Id>
  | ADT<'screenOutOfCodeChallenge', Id>
  | ADT<'startCodeChallenge'>;

export interface State extends Tab.Params {
  showModal: ModalId | null;
  startCodeChallengeLoading: number;
  screenToFromLoading: Id | null;
  canProposalsBeScreened: boolean;
  canViewProposals: boolean;
  proposals: SWUProposalSlim[];
  table: Immutable<Table.State>;
}

export type InnerMsg
  = ADT<'table', Table.Msg>
  | ADT<'showModal', ModalId>
  | ADT<'hideModal'>
  | ADT<'screenInToCodeChallenge', Id>
  | ADT<'screenOutOfCodeChallenge', Id>
  | ADT<'startCodeChallenge'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

const init: Init<Tab.Params, State> = async params => {
  const canViewProposals = canViewSWUOpportunityProposals(params.opportunity);
  let proposals: SWUProposalSlim[] = [];
  if (canViewProposals) {
    const proposalResult = await api.proposals.swu.readMany(params.opportunity.id);
    proposals = api
      .getValidValue(proposalResult, [])
      .sort((a, b) => {
        // Disqualified and Withdrawn statuses come last.
        if (a.status === SWUProposalStatus.Disqualified || a.status === SWUProposalStatus.Withdrawn) {
          if (b.status === SWUProposalStatus.Disqualified || b.status === SWUProposalStatus.Withdrawn) {
            return 0;
          } else {
            return 1;
          }
        }
        // Compare by score.
        // Give precendence to unscored proposals.
        if (a.questionsScore === undefined && b.questionsScore !== undefined) { return -1; }
        if (a.questionsScore !== undefined && b.questionsScore === undefined) { return 1; }
        if (a.questionsScore !== undefined && b.questionsScore !== undefined) {
          // If scores are not the same, sort by score.
          const result = compareNumbers(a.questionsScore, b.questionsScore);
          if (result) { return result; }
        }
        // Fallback to sorting by proponent name.
        return getSWUProponentName(a).localeCompare(getSWUProponentName(b));
      });
  }
  // Can be screened in if...
  // - Opportunity has the appropriate status; and
  // - At least one proposal has been evaluated.
  const canProposalsBeScreened = canSWUOpportunityBeScreenedInToCodeChallenge(params.opportunity) && proposals.reduce((acc, p) =>
    acc || canSWUProposalBeScreenedToFromCodeChallenge(p),
    false as boolean
  );
  return {
    startCodeChallengeLoading: 0,
    screenToFromLoading: null,
    showModal: null,
    canViewProposals,
    canProposalsBeScreened,
    proposals,
    table: immutable(await Table.init({
      idNamespace: 'proposal-table'
    })),
    ...params
  };
};

const startStartCodeChallengeLoading = makeStartLoading<State>('startCodeChallengeLoading');
const stopStartCodeChallengeLoading = makeStopLoading<State>('startCodeChallengeLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'startCodeChallenge':
      state = state.set('showModal', null);
      return [
        startStartCodeChallengeLoading(state),
        async (state, dispatch) => {
          const result = await api.opportunities.swu.update(state.opportunity.id, adt('startCodeChallenge', ''));
          if (!api.isValid(result)) {
            dispatch(toast(adt('error', opportunityToasts.statusChanged.error(SWUOpportunityStatus.EvaluationCodeChallenge))));
            return stopStartCodeChallengeLoading(state);
          }
          dispatch(toast(adt('success', opportunityToasts.statusChanged.success(SWUOpportunityStatus.EvaluationCodeChallenge))));
          dispatch(newRoute(adt('opportunitySWUEdit', {
            opportunityId: state.opportunity.id,
            tab: 'codeChallenge' as const
          })) as Msg);
          return state;
        }
      ];

    case 'screenInToCodeChallenge':
      state = state.set('showModal', null);
      return [
        state.set('screenToFromLoading', msg.value),
        async (state, dispatch) => {
          state = state.set('screenToFromLoading', null);
          const updateResult = await api.proposals.swu.update(msg.value, adt('screenInToCodeChallenge', ''));
          switch (updateResult.tag) {
            case 'valid':
              dispatch(toast(adt('success', proposalToasts.screenedIn.success)));
              return immutable(await init({
                opportunity: api.getValidValue(await api.opportunities.swu.readOne(state.opportunity.id), state.opportunity),
                viewerUser: state.viewerUser
              }));
            case 'invalid':
            case 'unhandled':
              dispatch(toast(adt('error', proposalToasts.screenedIn.error)));
              return state;
          }
      }];

    case 'screenOutOfCodeChallenge':
      state = state.set('showModal', null);
      return [
        state.set('screenToFromLoading', msg.value),
        async (state, dispatch) => {
          state = state.set('screenToFromLoading', null);
          //TODO once back-end is ready
          const updateResult = await api.proposals.swu.update(msg.value, adt('screenInToCodeChallenge', ''));
          switch (updateResult.tag) {
            case 'valid':
              dispatch(toast(adt('success', proposalToasts.screenedOut.success)));
              return immutable(await init({
                opportunity: api.getValidValue(await api.opportunities.swu.readOne(state.opportunity.id), state.opportunity),
                viewerUser: state.viewerUser
              }));
            case 'invalid':
            case 'unhandled':
              dispatch(toast(adt('error', proposalToasts.screenedOut.error)));
              return state;
          }
      }];

    case 'showModal':
      return [state.set('showModal', msg.value)];

    case 'hideModal':
      return [state.set('showModal', null)];

    case 'table':
      return updateComponentChild({
        state,
        childStatePath: ['table'],
        childUpdate: Table.update,
        childMsg: msg.value,
        mapChildMsg: value => ({ tag: 'table', value })
      });

    default:
      return [state];
  }
};

const makeCardData = (opportunity: SWUOpportunity, proposals: SWUProposalSlim[]): ReportCard[]  => {
  const numProposals = proposals.length;
  const [highestScore, averageScore] = proposals.reduce(([highest, average], { questionsScore }, i) => {
    if (!questionsScore) { return [highest, average]; }
    return [
      questionsScore > highest ? questionsScore : highest,
      (average * i + questionsScore) / (i + 1)
    ];
  }, [0, 0]);
  const isComplete = hasSWUOpportunityPassedTeamQuestions(opportunity);
  return [
    {
      icon: 'comment-dollar',
      name: `Proposal${numProposals === 1 ? '' : 's'}`,
      value: numProposals ? String(numProposals) : EMPTY_STRING
    },
    {
      icon: 'star-full',
      iconColor: 'yellow',
      name: 'Top TQ Score',
      value: isComplete && highestScore ? `${highestScore.toFixed(NUM_SCORE_DECIMALS)}%` : EMPTY_STRING
    },
    {
      icon: 'star-half',
      iconColor: 'yellow',
      name: 'Avg. TQ Score',
      value: isComplete && averageScore ? `${averageScore.toFixed(NUM_SCORE_DECIMALS)}%` : EMPTY_STRING
    }
  ];
};

const WaitForOpportunityToClose: ComponentView<State, Msg> = ({ state }) => {
  return (<div>Proposals will be displayed here once the opportunity has closed.</div>);
};

const ContextMenuCell: View<{ disabled: boolean; loading: boolean; proposal: SWUProposalSlim; dispatch: Dispatch<Msg>; }> = ({ disabled, loading, proposal, dispatch }) => {
  switch (proposal.status) {
    case SWUProposalStatus.EvaluatedTeamQuestions:
      return (
        <Link
          button
          symbol_={leftPlacement(iconLinkSymbol('stars'))}
          color='info'
          size='sm'
          disabled={disabled || loading}
          loading={loading}
          onClick={() => dispatch(adt('showModal', adt('screenInToCodeChallenge' as const, proposal.id))) }>
          Screen In
        </Link>
      );
    case SWUProposalStatus.UnderReviewCodeChallenge:
      return (
        <Link
          button
          symbol_={leftPlacement(iconLinkSymbol('ban'))}
          color='danger'
          size='sm'
          disabled={disabled || loading}
          loading={loading}
          onClick={() => dispatch(adt('showModal', adt('screenOutOfCodeChallenge' as const, proposal.id))) }>
          Screen Out
        </Link>
      );
    default:
      return null;
  }
};

interface ProponentCellProps {
  proposal: SWUProposalSlim;
  opportunity: SWUOpportunity;
  disabled: boolean;
}

const ProponentCell: View<ProponentCellProps> = ({ proposal, opportunity, disabled }) => {
  const proposalRouteParams = {
    proposalId: proposal.id,
    opportunityId: opportunity.id,
    tab: 'teamQuestions' as const
  };
  return (
    <div>
      <Link disabled={disabled} dest={routeDest(adt('proposalSWUView', proposalRouteParams))}>{getSWUProponentName(proposal)}</Link>
      {(() => {
        if (!proposal.organization) { return null; }
        return (
          <div className='small text-secondary text-uppercase'>
            {proposal.anonymousProponentName}
          </div>
        );
      })()}
    </div>
  );
};

function evaluationTableBodyRows(state: Immutable<State>, dispatch: Dispatch<Msg>): Table.BodyRows  {
  const isStartCodeChallengeLoading = state.startCodeChallengeLoading > 0;
  const isScreenToFromLoading = !!state.screenToFromLoading;
  const isLoading = isStartCodeChallengeLoading || isScreenToFromLoading;
  return state.proposals.map(p => {
    return [
      {
        className: 'text-wrap',
        children: (
          <ProponentCell
            proposal={p}
            opportunity={state.opportunity}
            disabled={isLoading} />
        )
      },
      { children: (<Badge text={swuProposalStatusToTitleCase(p.status, state.viewerUser.type)} color={swuProposalStatusToColor(p.status, state.viewerUser.type)} />) },
      {
        className: 'text-center',
        children: (<div>{p.questionsScore ? `${p.questionsScore.toFixed(NUM_SCORE_DECIMALS)}%` : EMPTY_STRING}</div>)
      },
      ...(state.canProposalsBeScreened
        ? [{
            className: 'text-right text-nowrap',
            children: (<ContextMenuCell dispatch={dispatch} proposal={p} disabled={isLoading} loading={state.screenToFromLoading === p.id} />)
          }]
        : [])
    ];
  });
}

function evaluationTableHeadCells(state: Immutable<State>): Table.HeadCells {
  return [
    {
      children: 'Proponent',
      className: 'text-nowrap',
      style: { width: '100%', minWidth: '240px' }
    },
    {
      children: 'Status',
      className: 'text-nowrap',
      style: { width: '0px' }
    },
    {
      children: 'Team Questions',
      className: 'text-nowrap text-center',
      style: { width: '0px' }
    },
    ...(state.canProposalsBeScreened
      ? [{
          children: '',
          className: 'text-nowrap text-right',
          style: { width: '0px' }
        }]
      : [])
  ];
}

const EvaluationTable: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <Table.view
      headCells={evaluationTableHeadCells(state)}
      bodyRows={evaluationTableBodyRows(state, dispatch)}
      state={state.table}
      dispatch={mapComponentDispatch(dispatch, msg => adt('table' as const, msg))} />
  );
};

const view: ComponentView<State, Msg> = (props) => {
  const { state } = props;
  const opportunity = state.opportunity;
  const cardData = makeCardData(opportunity, state.proposals);
  return (
    <div>
      <EditTabHeader opportunity={opportunity} viewerUser={state.viewerUser} />
      <Row className='mt-5'>
        <Col xs='12'>
          <ReportCardList reportCards={cardData} />
        </Col>
      </Row>
      <div className='border-top mt-5 pt-5'>
        <Row>
          <Col xs='12' className='d-flex flex-column flex-md-row justify-content-md-between align-items-start align-items-md-center mb-4'>
            <h4 className='mb-0'>Proposals</h4>
            {state.canViewProposals
              ? (<Link
                  newTab
                  color='info'
                  className='mt-3 mt-md-0'
                  symbol_={rightPlacement(iconLinkSymbol('file-export'))}
                  dest={routeDest(adt('proposalSWUExportAll', { opportunityId: opportunity.id }))}>
                  Export All Team Questions
                </Link>)
              : null}
          </Col>
          <Col xs='12'>
            {state.canViewProposals
              ? (<EvaluationTable {...props} />)
              : (<WaitForOpportunityToClose {...props} />)}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export const component: Tab.Component<State, Msg> = {
  init,
  update,
  view,

  getContextualActions: ({ state, dispatch }) => {
    if (!state.canViewProposals || !state.canProposalsBeScreened) { return null; }
    const isStartCodeChallengeLoading = state.startCodeChallengeLoading > 0;
    const isScreenToFromLoading = !!state.screenToFromLoading;
    const isLoading = isStartCodeChallengeLoading || isScreenToFromLoading;
    return adt('links', [{
      children: 'Begin Code Challenge',
      symbol_: leftPlacement(iconLinkSymbol('code')),
      color: 'primary',
      button: true,
      loading: isStartCodeChallengeLoading,
      disabled: (() => {
        // At least one proposal already screened in.
        return isLoading
            || !(canSWUOpportunityBeScreenedInToCodeChallenge(state.opportunity)
            && state.proposals.reduce((acc, p) => acc || p.status === SWUProposalStatus.UnderReviewCodeChallenge, false as boolean));
      })(),
      onClick: () => dispatch(adt('showModal', adt('startCodeChallenge')) as Msg)
    }]);
  },

  getModal: state => {
    if (!state.showModal) { return null; }
    switch (state.showModal.tag) {
      case 'screenInToCodeChallenge':
        return {
          title: 'Screen Proponent into Code Challenge?',
          onCloseMsg: adt('hideModal'),
          actions: [
            {
              text: 'Screen In',
              icon: 'stars',
              color: 'info',
              button: true,
              msg: adt('screenInToCodeChallenge', state.showModal.value)
            },
            {
              text: 'Cancel',
              color: 'secondary',
              msg: adt('hideModal')
            }
          ],
          body: () => 'Are you sure you want to screen this proponent into the Code Challenge?'
        };
      case 'screenOutOfCodeChallenge':
        return {
          title: 'Screen Proponent Out of Code Challenge?',
          onCloseMsg: adt('hideModal'),
          actions: [
            {
              text: 'Screen Out',
              icon: 'ban',
              color: 'danger',
              button: true,
              msg: adt('screenOutOfCodeChallenge', state.showModal.value)
            },
            {
              text: 'Cancel',
              color: 'secondary',
              msg: adt('hideModal')
            }
          ],
          body: () => 'Are you sure you want to screen this proponent out of the Code Challenge?'
        };
      case 'startCodeChallenge':
        return {
          title: 'Begin Code Challenge?',
          onCloseMsg: adt('hideModal'),
          actions: [
            {
              text: 'Begin Code Challenge',
              icon: 'code',
              color: 'primary',
              button: true,
              msg: adt('startCodeChallenge')
            },
            {
              text: 'Cancel',
              color: 'secondary',
              msg: adt('hideModal')
            }
          ],
          body: () => 'Are you sure you want to begin the Code Challenge? You will no longer be able to screen proponents in or out of the Code Challenge.'
        };
    }
  }
};
