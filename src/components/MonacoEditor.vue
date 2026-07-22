<template>
  <div ref="editorWrapper" class="col relative-position overflow-hidden editorWrapper">
    <q-resize-observer @resize="onResize" />
    <div ref="editorElement" class="absolute-top-left"></div>
  </div>
</template>
<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { onMounted, onUnmounted, ref, watch } from 'vue';

import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';

(self as any).MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

interface Props {
  modelValue?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorElement = ref<HTMLElement | null>(null);
const editorWrapper = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | undefined;

onMounted(() => {
  if (!editorElement.value) return;

  editor = monaco.editor.create(editorElement.value, {
    value: props.modelValue,
    language: 'json',
    theme: 'vs-dark',
    minimap: {
      enabled: false,
    },
    ...props.options,
  });
  editor.onDidChangeModelContent(() => {
    if (editor) emit('update:modelValue', editor.getValue());
  });
});

onUnmounted(() => {
  editor?.dispose();
});

watch(
  () => props.modelValue,
  (modelValue) => {
    if (modelValue !== editor?.getValue()) {
      editor?.getModel()?.setValue(modelValue);
      editor?.setScrollPosition({ scrollTop: 0 });
    }
  },
);

function onResize() {
  editor?.layout({ height: 0, width: 0 });
  window.setTimeout(() => {
    if (!editorWrapper.value) return;
    editor?.layout({
      height: editorWrapper.value.offsetHeight,
      width: editorWrapper.value.offsetWidth,
    });
  });
}
</script>

<style scoped>
.editorWrapper {
  background-color: #1e1e1e;
}
</style>
