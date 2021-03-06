<script>
import {
  GlAvatar,
  GlIcon,
  GlSprintf,
  GlModal,
  GlAlert,
  GlLoadingIcon,
  GlDeprecatedDropdown,
  GlDeprecatedDropdownItem,
  GlButton,
  GlTooltipDirective,
} from '@gitlab/ui';
import { __ } from '~/locale';
import TimeAgoTooltip from '~/vue_shared/components/time_ago_tooltip.vue';

import DeleteSnippetMutation from '../mutations/deleteSnippet.mutation.graphql';
import CanCreatePersonalSnippet from '../queries/userPermissions.query.graphql';
import CanCreateProjectSnippet from '../queries/projectPermissions.query.graphql';
import { joinPaths } from '~/lib/utils/url_utility';

export default {
  components: {
    GlAvatar,
    GlIcon,
    GlSprintf,
    GlModal,
    GlAlert,
    GlLoadingIcon,
    GlDeprecatedDropdown,
    GlDeprecatedDropdownItem,
    TimeAgoTooltip,
    GlButton,
  },
  directives: {
    GlTooltip: GlTooltipDirective,
  },
  apollo: {
    canCreateSnippet: {
      query() {
        return this.snippet.project ? CanCreateProjectSnippet : CanCreatePersonalSnippet;
      },
      variables() {
        return {
          fullPath: this.snippet.project ? this.snippet.project.fullPath : undefined,
        };
      },
      update(data) {
        return this.snippet.project
          ? data.project.userPermissions.createSnippet
          : data.currentUser?.userPermissions.createSnippet;
      },
    },
  },
  props: {
    snippet: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isDeleting: false,
      errorMessage: '',
      canCreateSnippet: false,
    };
  },
  computed: {
    snippetHasBinary() {
      return Boolean(this.snippet.blobs.find(blob => blob.binary));
    },
    authoredMessage() {
      return this.snippet.author
        ? __('Authored %{timeago} by %{author}')
        : __('Authored %{timeago}');
    },
    personalSnippetActions() {
      return [
        {
          condition: this.snippet.userPermissions.updateSnippet,
          text: __('Edit'),
          href: this.editLink,
          disabled: this.snippetHasBinary,
          title: this.snippetHasBinary
            ? __('Snippets with non-text files can only be edited via Git.')
            : undefined,
        },
        {
          condition: this.snippet.userPermissions.adminSnippet,
          text: __('Delete'),
          click: this.showDeleteModal,
          variant: 'danger',
          category: 'secondary',
          cssClass: 'ml-2',
        },
        {
          condition: this.canCreateSnippet,
          text: __('New snippet'),
          href: this.snippet.project
            ? joinPaths(this.snippet.project.webUrl, '-/snippets/new')
            : joinPaths('/', gon.relative_url_root, '/-/snippets/new'),
          variant: 'success',
          category: 'secondary',
          cssClass: 'ml-2',
        },
      ];
    },
    editLink() {
      return `${this.snippet.webUrl}/edit`;
    },
    visibility() {
      return this.snippet.visibilityLevel;
    },
    snippetVisibilityLevelDescription() {
      switch (this.visibility) {
        case 'private':
          return this.snippet.project !== null
            ? __('The snippet is visible only to project members.')
            : __('The snippet is visible only to me.');
        case 'internal':
          return __('The snippet is visible to any logged in user.');
        default:
          return __('The snippet can be accessed without any authentication.');
      }
    },
    visibilityLevelIcon() {
      switch (this.visibility) {
        case 'private':
          return 'lock';
        case 'internal':
          return 'shield';
        default:
          return 'earth';
      }
    },
  },
  methods: {
    redirectToSnippets() {
      window.location.pathname = this.snippet.project
        ? `${this.snippet.project.fullPath}/-/snippets`
        : `${gon.relative_url_root}dashboard/snippets`;
    },
    closeDeleteModal() {
      this.$refs.deleteModal.hide();
    },
    showDeleteModal() {
      this.$refs.deleteModal.show();
    },
    deleteSnippet() {
      this.isDeleting = true;
      this.$apollo
        .mutate({
          mutation: DeleteSnippetMutation,
          variables: { id: this.snippet.id },
        })
        .then(({ data }) => {
          if (data?.destroySnippet?.errors.length) {
            throw new Error(data?.destroySnippet?.errors[0]);
          }
          this.isDeleting = false;
          this.errorMessage = undefined;
          this.closeDeleteModal();
          this.redirectToSnippets();
        })
        .catch(err => {
          this.isDeleting = false;
          this.errorMessage = err.message;
        });
    },
  },
};
</script>
<template>
  <div class="detail-page-header">
    <div class="detail-page-header-body">
      <div
        class="snippet-box has-tooltip d-flex align-items-center gl-mr-2 mb-1"
        data-qa-selector="snippet_container"
        :title="snippetVisibilityLevelDescription"
        data-container="body"
      >
        <span class="sr-only">
          {{ s__(`VisibilityLevel|${visibility}`) }}
        </span>
        <gl-icon :name="visibilityLevelIcon" :size="14" />
      </div>
      <div class="creator" data-testid="authored-message">
        <gl-sprintf :message="authoredMessage">
          <template #timeago>
            <time-ago-tooltip
              :time="snippet.createdAt"
              tooltip-placement="bottom"
              css-class="snippet_updated_ago"
            />
          </template>
          <template #author>
            <a :href="snippet.author.webUrl" class="d-inline">
              <gl-avatar :size="24" :src="snippet.author.avatarUrl" />
              <span class="bold">{{ snippet.author.name }}</span>
            </a>
          </template>
        </gl-sprintf>
      </div>
    </div>

    <div class="detail-page-header-actions">
      <div class="d-none d-sm-flex">
        <template v-for="(action, index) in personalSnippetActions">
          <div
            v-if="action.condition"
            :key="index"
            v-gl-tooltip
            :title="action.title"
            class="d-inline-block"
          >
            <gl-button
              :disabled="action.disabled"
              :variant="action.variant"
              :category="action.category"
              :class="action.cssClass"
              :href="action.href"
              data-qa-selector="snippet_action_button"
              :data-qa-action="action.text"
              @click="action.click ? action.click() : undefined"
            >
              {{ action.text }}
            </gl-button>
          </div>
        </template>
      </div>
      <div class="d-block d-sm-none dropdown">
        <gl-deprecated-dropdown :text="__('Options')" class="w-100" toggle-class="text-center">
          <gl-deprecated-dropdown-item
            v-for="(action, index) in personalSnippetActions"
            :key="index"
            :disabled="action.disabled"
            :title="action.title"
            :href="action.href"
            @click="action.click ? action.click() : undefined"
            >{{ action.text }}</gl-deprecated-dropdown-item
          >
        </gl-deprecated-dropdown>
      </div>
    </div>

    <gl-modal ref="deleteModal" modal-id="delete-modal" title="Example title">
      <template #modal-title>{{ __('Delete snippet?') }}</template>

      <gl-alert v-if="errorMessage" variant="danger" class="mb-2" @dismiss="errorMessage = ''">{{
        errorMessage
      }}</gl-alert>

      <gl-sprintf :message="__('Are you sure you want to delete %{name}?')">
        <template #name
          ><strong>{{ snippet.title }}</strong></template
        >
      </gl-sprintf>

      <template #modal-footer>
        <gl-button @click="closeDeleteModal">{{ __('Cancel') }}</gl-button>
        <gl-button
          variant="danger"
          category="primary"
          :disabled="isDeleting"
          data-qa-selector="delete_snippet_button"
          @click="deleteSnippet"
        >
          <gl-loading-icon v-if="isDeleting" inline />
          {{ __('Delete snippet') }}
        </gl-button>
      </template>
    </gl-modal>
  </div>
</template>
