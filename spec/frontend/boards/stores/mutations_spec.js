import mutations from '~/boards/stores/mutations';
import * as types from '~/boards/stores/mutation_types';
import defaultState from '~/boards/stores/state';
import {
  listObj,
  listObjDuplicate,
  mockIssue,
  mockIssue2,
  mockListsWithModel,
  mockLists,
} from '../mock_data';

const expectNotImplemented = action => {
  it('is not implemented', () => {
    expect(action).toThrow(new Error('Not implemented!'));
  });
};

describe('Board Store Mutations', () => {
  let state;

  beforeEach(() => {
    state = defaultState();
  });

  describe('SET_INITIAL_BOARD_DATA', () => {
    it('Should set initial Boards data to state', () => {
      const endpoints = {
        boardsEndpoint: '/boards/',
        recentBoardsEndpoint: '/boards/',
        listsEndpoint: '/boards/lists',
        bulkUpdatePath: '/boards/bulkUpdate',
        boardId: 1,
        fullPath: 'gitlab-org',
      };
      const boardType = 'group';
      const disabled = false;
      const showPromotion = false;

      mutations[types.SET_INITIAL_BOARD_DATA](state, {
        ...endpoints,
        boardType,
        disabled,
        showPromotion,
      });

      expect(state.endpoints).toEqual(endpoints);
      expect(state.boardType).toEqual(boardType);
      expect(state.disabled).toEqual(disabled);
      expect(state.showPromotion).toEqual(showPromotion);
    });
  });

  describe('RECEIVE_LISTS', () => {
    it('Should set boardLists to state', () => {
      const lists = [listObj, listObjDuplicate];

      mutations[types.RECEIVE_LISTS](state, lists);

      expect(state.boardLists).toEqual(lists);
    });
  });

  describe('SET_ACTIVE_ID', () => {
    const expected = { id: 1, sidebarType: '' };

    beforeEach(() => {
      mutations.SET_ACTIVE_ID(state, expected);
    });

    it('updates aciveListId to be the value that is passed', () => {
      expect(state.activeId).toBe(expected.id);
    });

    it('updates sidebarType to be the value that is passed', () => {
      expect(state.sidebarType).toBe(expected.sidebarType);
    });
  });

  describe('SET_FILTERS', () => {
    it('updates filterParams to be the value that is passed', () => {
      const filterParams = { labelName: 'label' };

      mutations.SET_FILTERS(state, filterParams);

      expect(state.filterParams).toBe(filterParams);
    });
  });

  describe('REQUEST_ADD_LIST', () => {
    expectNotImplemented(mutations.REQUEST_ADD_LIST);
  });

  describe('RECEIVE_ADD_LIST_SUCCESS', () => {
    expectNotImplemented(mutations.RECEIVE_ADD_LIST_SUCCESS);
  });

  describe('RECEIVE_ADD_LIST_ERROR', () => {
    expectNotImplemented(mutations.RECEIVE_ADD_LIST_ERROR);
  });

  describe('MOVE_LIST', () => {
    it('updates boardLists state with reordered lists', () => {
      state = {
        ...state,
        boardLists: mockListsWithModel,
      };

      mutations.MOVE_LIST(state, {
        movedList: mockListsWithModel[0],
        listAtNewIndex: mockListsWithModel[1],
      });

      expect(state.boardLists).toEqual([mockListsWithModel[1], mockListsWithModel[0]]);
    });
  });

  describe('UPDATE_LIST_FAILURE', () => {
    it('updates boardLists state with previous order and sets error message', () => {
      state = {
        ...state,
        boardLists: [mockListsWithModel[1], mockListsWithModel[0]],
        error: undefined,
      };

      mutations.UPDATE_LIST_FAILURE(state, mockListsWithModel);

      expect(state.boardLists).toEqual(mockListsWithModel);
      expect(state.error).toEqual('An error occurred while updating the list. Please try again.');
    });
  });

  describe('REQUEST_REMOVE_LIST', () => {
    expectNotImplemented(mutations.REQUEST_REMOVE_LIST);
  });

  describe('RECEIVE_REMOVE_LIST_SUCCESS', () => {
    expectNotImplemented(mutations.RECEIVE_REMOVE_LIST_SUCCESS);
  });

  describe('RECEIVE_REMOVE_LIST_ERROR', () => {
    expectNotImplemented(mutations.RECEIVE_REMOVE_LIST_ERROR);
  });

  describe('REQUEST_ISSUES_FOR_ALL_LISTS', () => {
    it('sets isLoadingIssues to true', () => {
      expect(state.isLoadingIssues).toBe(false);

      mutations.REQUEST_ISSUES_FOR_ALL_LISTS(state);

      expect(state.isLoadingIssues).toBe(true);
    });
  });

  describe('RECEIVE_ISSUES_FOR_ALL_LISTS_SUCCESS', () => {
    it('sets isLoadingIssues to false and updates issuesByListId object', () => {
      const listIssues = {
        '': [mockIssue.id],
      };
      const issues = {
        '1': mockIssue,
      };

      state = {
        ...state,
        isLoadingIssues: true,
        issuesByListId: {},
        issues: {},
      };

      mutations.RECEIVE_ISSUES_FOR_ALL_LISTS_SUCCESS(state, { listData: listIssues, issues });

      expect(state.isLoadingIssues).toBe(false);
      expect(state.issuesByListId).toEqual(listIssues);
      expect(state.issues).toEqual(issues);
    });
  });

  describe('REQUEST_ADD_ISSUE', () => {
    expectNotImplemented(mutations.REQUEST_ADD_ISSUE);
  });

  describe('RECEIVE_ISSUES_FOR_ALL_LISTS_FAILURE', () => {
    it('sets isLoadingIssues to false and sets error message', () => {
      state = {
        ...state,
        isLoadingIssues: true,
        error: undefined,
      };

      mutations.RECEIVE_ISSUES_FOR_ALL_LISTS_FAILURE(state);

      expect(state.isLoadingIssues).toBe(false);
      expect(state.error).toEqual(
        'An error occurred while fetching the board issues. Please reload the page.',
      );
    });
  });

  describe('UPDATE_ISSUE_BY_ID', () => {
    const issueId = '1';
    const prop = 'id';
    const value = '2';
    const issue = { [issueId]: { id: 1, title: 'Issue' } };

    beforeEach(() => {
      state = {
        ...state,
        isLoadingIssues: true,
        error: undefined,
        issues: {
          ...issue,
        },
      };
    });

    describe('when the issue is in state', () => {
      it('updates the property of the correct issue', () => {
        mutations.UPDATE_ISSUE_BY_ID(state, {
          issueId,
          prop,
          value,
        });

        expect(state.issues[issueId]).toEqual({ ...issue[issueId], id: '2' });
      });
    });

    describe('when the issue is not in state', () => {
      it('throws an error', () => {
        expect(() => {
          mutations.UPDATE_ISSUE_BY_ID(state, {
            issueId: '3',
            prop,
            value,
          });
        }).toThrow(new Error('No issue found.'));
      });
    });
  });

  describe('RECEIVE_ADD_ISSUE_SUCCESS', () => {
    expectNotImplemented(mutations.RECEIVE_ADD_ISSUE_SUCCESS);
  });

  describe('RECEIVE_ADD_ISSUE_ERROR', () => {
    expectNotImplemented(mutations.RECEIVE_ADD_ISSUE_ERROR);
  });

  describe('REQUEST_MOVE_ISSUE', () => {
    expectNotImplemented(mutations.REQUEST_MOVE_ISSUE);
  });

  describe('RECEIVE_MOVE_ISSUE_SUCCESS', () => {
    expectNotImplemented(mutations.RECEIVE_MOVE_ISSUE_SUCCESS);
  });

  describe('RECEIVE_MOVE_ISSUE_ERROR', () => {
    expectNotImplemented(mutations.RECEIVE_MOVE_ISSUE_ERROR);
  });

  describe('REQUEST_UPDATE_ISSUE', () => {
    expectNotImplemented(mutations.REQUEST_UPDATE_ISSUE);
  });

  describe('RECEIVE_UPDATE_ISSUE_SUCCESS', () => {
    expectNotImplemented(mutations.RECEIVE_UPDATE_ISSUE_SUCCESS);
  });

  describe('RECEIVE_UPDATE_ISSUE_ERROR', () => {
    expectNotImplemented(mutations.RECEIVE_UPDATE_ISSUE_ERROR);
  });

  describe('ADD_ISSUE_TO_LIST', () => {
    it('adds issue to issues state and issue id in list in issuesByListId', () => {
      const listIssues = {
        'gid://gitlab/List/1': [mockIssue.id],
      };
      const issues = {
        '1': mockIssue,
      };

      state = {
        ...state,
        issuesByListId: listIssues,
        issues,
      };

      mutations.ADD_ISSUE_TO_LIST(state, { list: mockLists[0], issue: mockIssue2 });

      expect(state.issuesByListId['gid://gitlab/List/1']).toContain(mockIssue2.id);
      expect(state.issues[mockIssue2.id]).toEqual(mockIssue2);
    });
  });

  describe('ADD_ISSUE_TO_LIST_FAILURE', () => {
    it('removes issue id from list in issuesByListId', () => {
      const listIssues = {
        'gid://gitlab/List/1': [mockIssue.id, mockIssue2.id],
      };
      const issues = {
        '1': mockIssue,
        '2': mockIssue2,
      };

      state = {
        ...state,
        issuesByListId: listIssues,
        issues,
      };

      mutations.ADD_ISSUE_TO_LIST_FAILURE(state, { list: mockLists[0], issue: mockIssue2 });

      expect(state.issuesByListId['gid://gitlab/List/1']).not.toContain(mockIssue2.id);
    });
  });

  describe('SET_CURRENT_PAGE', () => {
    expectNotImplemented(mutations.SET_CURRENT_PAGE);
  });

  describe('TOGGLE_EMPTY_STATE', () => {
    expectNotImplemented(mutations.TOGGLE_EMPTY_STATE);
  });
});
