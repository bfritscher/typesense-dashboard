<template>
  <q-list style="min-width: 100px">
    <q-item v-if="props.showLogout" v-close-popup clickable @click="store.logout">
      <q-item-section>Logout</q-item-section>
      <q-item-section avatar>
        <q-icon name="sym_s_logout" />
      </q-item-section>
    </q-item>
    <q-separator v-if="props.showLogout" />
    <q-item v-close-popup clickable @click="store.clearHistory">
      <q-item-section>Clear history</q-item-section>
      <q-item-section avatar>
        <q-icon name="sym_s_delete" />
      </q-item-section>
    </q-item>
    <q-separator />
    <q-item-label v-if="store.loginHistoryParsed.length === 0" header>No History</q-item-label>
    <q-item-label v-if="store.loginHistoryParsed.length > 0" header>Server History</q-item-label>
    <q-item
      v-for="(history, index) in store.loginHistoryParsed"
      :key="index"
      v-close-popup
      clickable
      dense
      @click="loginWithHistory(history)"
    >
      <q-item-section>
        <div class="row items-center no-wrap">
          <div class="col">
            <div>{{ history.node.protocol }}://{{ history.node.host }}:{{ history.node.port }}</div>
            <div v-if="history.apiKey && hasMultipleKeys(history)" class="text-caption text-grey-7">
              key: {{ apiKeyPrefix(history) }}…
            </div>
          </div>
          <div v-if="history.clusterTag" class="col-auto">
            <q-chip size="sm" color="accent" text-color="white" dense>
              {{ history.clusterTag }}
            </q-chip>
          </div>
        </div>
      </q-item-section>
      <q-item-section side>
        <q-btn flat round dense icon="sym_s_edit" @click.stop="openTagEditor(index)">
          <q-tooltip>Set cluster tag or delete</q-tooltip>
        </q-btn>
      </q-item-section>
    </q-item>

    <q-dialog v-model="tagDialog.visible">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Set Cluster Tag</div>
          <div class="text-subtitle2 text-grey-7">Group servers by giving them the same tag.</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="tagDialog.value"
            :options="filteredTags"
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            new-value-mode="add"
            outlined
            label="Cluster tag"
            @filter="filterTags"
            @new-value="onNewTag"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Delete entry"
            color="negative"
            @click="removeHistory(tagDialog.index!)"
          />
          <q-btn flat label="Remove tag" color="warning" @click="clearTag()" />
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn unelevated color="accent" label="Save" @click="saveTag()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-list>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useNodeStore } from 'src/stores/node';
import type { NodeLoginDataInterface } from 'src/stores/node';

const props = defineProps({
  showLogout: {
    type: Boolean,
    default: false,
  },
});

const store = useNodeStore();

function loginWithHistory(history: NodeLoginDataInterface) {
  // Force redirection used the MainLayout Menu
  const forceHomeRedirect = props.showLogout;
  void store.login({ ...history, forceHomeRedirect });
}

function removeHistory(index: number) {
  store.removeHistoryAt(index);
  tagDialog.visible = false;
}

const tagDialog = reactive<{ index: number | null; visible: boolean; value: string }>({
  index: null,
  visible: false,
  value: '',
});

// Track current input text in the QSelect so clicking Save without selecting still works
const pendingTagInput = ref<string>('');
// Track the original tag at dialog open, so we can detect rename vs unchanged
const originalTag = ref<string>('');

function openTagEditor(index: number) {
  tagDialog.index = index;
  const parsed = store.loginHistoryParsed[index];
  tagDialog.value = parsed?.clusterTag || '';
  pendingTagInput.value = tagDialog.value;
  originalTag.value = tagDialog.value;
  tagDialog.visible = true;
}

function saveTag() {
  if (tagDialog.index === null) return;
  const typed = pendingTagInput.value.trim();
  const current = (tagDialog.value || '').trim();
  const base = originalTag.value.trim();
  // If user typed something different from the original, prefer that; otherwise use current model
  const chosen = typed && typed !== base ? typed : current;
  if (chosen.length > 0) {
    store.setHistoryTag(tagDialog.index, chosen);
  }
  tagDialog.visible = false;
}

function clearTag() {
  if (tagDialog.index === null) return;
  store.removeHistoryTag(tagDialog.index);
  tagDialog.visible = false;
}

// Tag autocomplete: compute all tags and provide filterable list
const allTags = computed<string[]>(() => {
  const tags = new Set<string>();
  store.loginHistoryParsed.forEach((entry) => {
    if (entry.clusterTag) tags.add(entry.clusterTag);
  });
  return Array.from(tags).sort();
});

const filteredTags = ref<string[]>(allTags.value);
function filterTags(val: string, update: (cb: () => void) => void) {
  update(() => {
    pendingTagInput.value = val || '';
    if (!val) {
      filteredTags.value = allTags.value;
    } else {
      const needle = val.toLowerCase();
      filteredTags.value = allTags.value.filter((t) => t.toLowerCase().includes(needle));
    }
  });
}
function onNewTag(val: string, done: (val: string) => void) {
  done(val);
}

// Group api keys by host:port and detect duplicates for the same server
const apiKeysByServer = computed<Map<string, Set<string>>>(() => {
  const map = new Map<string, Set<string>>();
  for (const entry of store.loginHistoryParsed) {
    if (!entry?.node) continue;
    const serverId = `${entry.node.host}:${String(entry.node.port ?? '')}`;
    let set = map.get(serverId);
    if (!set) {
      set = new Set<string>();
      map.set(serverId, set);
    }
    if (entry.apiKey) set.add(entry.apiKey);
  }
  return map;
});

function hasMultipleKeys(h: NodeLoginDataInterface): boolean {
  const serverId = `${h.node.host}:${String(h.node.port ?? '')}`;
  const set = apiKeysByServer.value.get(serverId);
  return !!set && set.size > 1;
}

function apiKeyPrefix(h: NodeLoginDataInterface): string {
  const key = (h.apiKey || '').toString();
  return key.slice(0, 3);
}
</script>
