import { defineStore, acceptHMRUpdate } from 'pinia';
import { Notify } from 'quasar';
import { useNodeStore } from './node';
import { Api } from 'src/shared/api';
import type { MerchandisingEdit, BatchUpdateResult, ProductMerchandisingFields } from 'src/shared/types';
import { calculateDefaultRank, calculateDefaultRankWithPin } from 'src/shared/types';

interface MerchandisingState {
  pendingEdits: Map<string, MerchandisingEdit>;
  selectedProducts: Set<string>;
  isApplying: boolean;
  applyResults: BatchUpdateResult[];
}

export const useMerchandisingStore = defineStore('merchandising', {
  state: (): MerchandisingState => ({
    pendingEdits: new Map(),
    selectedProducts: new Set(),
    isApplying: false,
    applyResults: [],
  }),
  getters: {
    hasPendingEdits(state): boolean {
      return state.pendingEdits.size > 0;
    },
    pendingEditCount(state): number {
      return state.pendingEdits.size;
    },
    failedDocIds(state): string[] {
      return state.applyResults
        .filter((r) => !r.success)
        .map((r) => r.docId);
    },
  },
  actions: {
    addEdit(docId: string, field: keyof ProductMerchandisingFields, value: any, originalDoc?: Partial<ProductMerchandisingFields>) {
      const existing = this.pendingEdits.get(docId);
      if (existing) {
        existing.changes[field] = value;
        this.pendingEdits.set(docId, { ...existing });
      } else {
        const edit: MerchandisingEdit = {
          docId,
          original: originalDoc || {},
          changes: { [field]: value } as Partial<ProductMerchandisingFields>,
        };
        this.pendingEdits.set(docId, edit);
      }
    },

    discardEdit(docId: string) {
      this.pendingEdits.delete(docId);
    },

    discardAllEdits() {
      this.pendingEdits.clear();
      this.applyResults = [];
    },

    selectProduct(id: string) {
      this.selectedProducts.add(id);
    },

    deselectProduct(id: string) {
      this.selectedProducts.delete(id);
    },

    selectAll(ids: string[]) {
      ids.forEach((id) => this.selectedProducts.add(id));
    },

    deselectAll() {
      this.selectedProducts.clear();
    },

    async applyChanges(collectionName: string) {
      const nodeStore = useNodeStore();
      const api = nodeStore.api as Api | undefined;
      if (!api) {
        Notify.create({ type: 'negative', message: 'Not connected to TypeSense' });
        return;
      }

      this.isApplying = true;
      this.applyResults = [];

      try {
        // Build JSONL payload: for each edited doc, read current popularity, recalculate ranks
        const updates: Record<string, any>[] = [];

        for (const [docId, edit] of this.pendingEdits) {
          try {
            // Read current document to get popularity
            const currentDoc = await api.getDocumentById(collectionName, docId);
            const popularity = (currentDoc as any)?.popularity ?? 0;

            // Merge original + changes to get final state
            const merged = { ...edit.original, ...edit.changes };
            const isFeatured = merged.is_featured ?? (currentDoc as any)?.is_featured ?? false;
            const pinPriority = merged.pin_priority ?? (currentDoc as any)?.pin_priority ?? 0;

            const defaultRank = calculateDefaultRank(isFeatured, popularity);
            const defaultRankWithPin = calculateDefaultRankWithPin(pinPriority, defaultRank);

            updates.push({
              id: docId,
              ...edit.changes,
              default_rank: defaultRank,
              default_rank_with_pin: defaultRankWithPin,
              merchandising_source: 'dashboard',
            });
          } catch (err) {
            this.applyResults.push({
              success: false,
              docId,
              error: `Failed to read document: ${(err as Error).message}`,
            });
          }
        }

        if (updates.length === 0) {
          this.isApplying = false;
          return;
        }

        // Batch import via JSONL
        const results = await api.importDocuments(collectionName, updates, 'update');

        // Parse results
        if (Array.isArray(results)) {
          results.forEach((result: any, index: number) => {
            const docId = updates[index]?.id;
            if (result.success) {
              this.applyResults.push({ success: true, docId });
              this.pendingEdits.delete(docId);
            } else {
              this.applyResults.push({
                success: false,
                docId,
                error: result.error || 'Unknown error',
              });
            }
          });
        }

        const successCount = this.applyResults.filter((r) => r.success).length;
        const failCount = this.applyResults.filter((r) => !r.success).length;

        if (failCount === 0) {
          Notify.create({ type: 'positive', message: `Updated ${successCount} products` });
        } else {
          Notify.create({
            type: 'warning',
            message: `${successCount} succeeded, ${failCount} failed`,
          });
        }
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: `Batch update failed: ${(err as Error).message}`,
        });
      } finally {
        this.isApplying = false;
      }
    },

    async retryFailed(collectionName: string) {
      // Keep only failed edits, then re-apply
      const failedIds = this.failedDocIds;
      const editsToRetry = new Map<string, MerchandisingEdit>();
      for (const id of failedIds) {
        const edit = this.pendingEdits.get(id);
        if (edit) editsToRetry.set(id, edit);
      }
      this.pendingEdits = editsToRetry;
      this.applyResults = [];
      await this.applyChanges(collectionName);
    },

    async resetToDbValues(collectionName: string, docId: string) {
      const nodeStore = useNodeStore();
      const api = nodeStore.api as Api | undefined;
      if (!api) return;

      try {
        await api.importDocuments(
          collectionName,
          [{ id: docId, merchandising_source: null }],
          'update',
        );
        Notify.create({ type: 'positive', message: 'Product released to DB management' });
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: `Reset failed: ${(err as Error).message}`,
        });
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMerchandisingStore, import.meta.hot));
}
