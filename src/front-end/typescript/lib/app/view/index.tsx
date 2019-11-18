import { Msg, Route, State } from 'front-end/lib/app/types';
import Footer from 'front-end/lib/app/view/footer';
import Nav from 'front-end/lib/app/view/nav';
import ViewPage from 'front-end/lib/app/view/page';
import { AppMsg, ComponentView, Dispatch, View } from 'front-end/lib/framework';
import * as PageAuthorCreate from 'front-end/lib/pages/author/create';
import * as PageAuthorList from 'front-end/lib/pages/author/list';
import * as PageBookCreate from 'front-end/lib/pages/book/create';
import * as PageBookList from 'front-end/lib/pages/book/list';
import * as PageGenreList from 'front-end/lib/pages/genre/list';
import * as PageLibrarianSignIn from 'front-end/lib/pages/librarian-sign-in';
import * as PageNotice from 'front-end/lib/pages/notice';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { default as React } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

interface ViewModalProps {
  modal: State['modal'];
  dispatch: Dispatch<AppMsg<Msg, Route>>;
}

const ViewModal: View<ViewModalProps> = ({ dispatch, modal }) => {
  const { open, content } = modal;
  const closeModal = () => dispatch({ tag: 'closeModal', value: undefined });
  // TODO custom X icon
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader className='align-items-center' toggle={closeModal} close={(<Icon name='times' color='secondary' onClick={closeModal} style={{ cursor: 'pointer' }}/>)}>{content.title}</ModalHeader>
      <ModalBody>{content.body}</ModalBody>
      <ModalFooter className='p-0' style={{ overflowX: 'auto', justifyContent: 'normal' }}>
        <div className='p-3 d-flex flex-md-row-reverse justify-content-start align-items-center text-nowrap flex-grow-1'>
          {content.actions.map(({ button, text, color, msg }, i) => {
            const props = {
              key: `modal-action-${i}`,
              color,
              onClick: () => dispatch(msg),
              className: i === 0 ? 'mx-0' : 'ml-3 mr-0 ml-md-0 mr-md-3'
            };
            if (button) {
              return (<Link button {...props}>{text}</Link>);
            } else {
              return (<Link {...props}>{text}</Link>);
            }
          })}
        </div>
      </ModalFooter>
    </Modal>
  );
};

const ViewActiveRoute: ComponentView<State, Msg> = ({ state, dispatch }) => {
  switch (state.activeRoute.tag) {

    case 'bookCreate':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.bookCreate}
          mapPageMsg={value => ({ tag: 'pageBookCreate', value })}
          component={PageBookCreate.component} />
      );

    case 'bookList':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.bookList}
          mapPageMsg={value => ({ tag: 'pageBookList', value })}
          component={PageBookList.component} />
      );

    case 'genreList':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.genreList}
          mapPageMsg={value => ({ tag: 'pageGenreList', value })}
          component={PageGenreList.component} />
      );

    case 'authorCreate':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.authorCreate}
          mapPageMsg={value => ({ tag: 'pageAuthorCreate', value })}
          component={PageAuthorCreate.component} />
      );

    case 'authorList':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.authorList}
          mapPageMsg={value => ({ tag: 'pageAuthorList', value })}
          component={PageAuthorList.component} />
      );

    case 'librarianSignIn':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.librarianSignIn}
          mapPageMsg={value => ({ tag: 'pageLibrarianSignIn', value })}
          component={PageLibrarianSignIn.component} />
      );

    case 'signOut':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signOut}
          mapPageMsg={value => ({ tag: 'pageSignOut', value })}
          component={PageSignOut.component} />
      );

    case 'notice':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.notice}
          mapPageMsg={value => ({ tag: 'pageNotice', value })}
          component={PageNotice.component} />
      );
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.ready) {
    return null;
  } else {
    return (
      <div className={`route-${state.activeRoute.tag} ${state.transitionLoading > 0 ? 'in-transition' : ''} app d-flex flex-column`} style={{ minHeight: '100vh' }}>
        <Nav session={state.shared.session} activeRoute={state.activeRoute} isOpen={state.isNavOpen} toggleIsOpen={value => dispatch({ tag: 'toggleIsNavOpen', value })} />
        <ViewActiveRoute state={state} dispatch={dispatch} />
        <Footer session={state.shared.session} />
        <ViewModal dispatch={dispatch} modal={state.modal} />
      </div>
    );
  }
};

export default view;