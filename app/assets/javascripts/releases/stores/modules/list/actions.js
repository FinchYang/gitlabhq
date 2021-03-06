import * as types from './mutation_types';
import { deprecatedCreateFlash as createFlash } from '~/flash';
import { __ } from '~/locale';
import api from '~/api';
import {
  normalizeHeaders,
  parseIntPagination,
  convertObjectPropsToCamelCase,
} from '~/lib/utils/common_utils';

/**
 * Commits a mutation to update the state while the main endpoint is being requested.
 */
export const requestReleases = ({ commit }) => commit(types.REQUEST_RELEASES);

/**
 * Fetches the main endpoint.
 * Will dispatch requestNamespace action before starting the request.
 * Will dispatch receiveNamespaceSuccess if the request is successful
 * Will dispatch receiveNamesapceError if the request returns an error
 *
 * @param {String} projectId
 */
export const fetchReleases = ({ dispatch }, { page = '1', projectId }) => {
  dispatch('requestReleases');

  api
    .releases(projectId, { page })
    .then(response => dispatch('receiveReleasesSuccess', response))
    .catch(() => dispatch('receiveReleasesError'));
};

export const receiveReleasesSuccess = ({ commit }, { data, headers }) => {
  const pageInfo = parseIntPagination(normalizeHeaders(headers));
  const camelCasedReleases = convertObjectPropsToCamelCase(data, { deep: true });
  commit(types.RECEIVE_RELEASES_SUCCESS, {
    data: camelCasedReleases,
    pageInfo,
  });
};

export const receiveReleasesError = ({ commit }) => {
  commit(types.RECEIVE_RELEASES_ERROR);
  createFlash(__('An error occurred while fetching the releases. Please try again.'));
};
