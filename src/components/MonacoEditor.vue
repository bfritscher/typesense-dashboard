<template>
  <div ref="editorWrapper" class="col relative-position overflow-hidden editorWrapper">
    <q-resize-observer @resize="onResize" />
    <div ref="editorElement" class="absolute-top-left"></div>
  </div>
</template>
<script lang="ts">
import * as monaco from 'monaco-editor';
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';

import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
self.MonacoEnvironment = {
  getWorker() {
    return new jsonWorker()
  }
}

export default defineComponent({
  name: 'MonacoEditor',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    options: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorElement = ref<HTMLElement | null>(null);
    const editorWrapper = ref<HTMLElement | null>(null);
    let editor: monaco.editor.IStandaloneCodeEditor | undefined;
    onMounted(() => {
      editor = monaco.editor.create(
        editorElement.value as HTMLElement,
        Object.assign(
          {
            value: props.modelValue,
            language: 'json',
            theme: 'vs-dark',
            minimap: {
              enabled: false,
            },
          },
          props.options,
        ),
      );
      editor.onDidChangeModelContent(() => {
        emit('update:modelValue', editor?.getValue());
      });
    });
    onUnmounted(() => {
      editor?.dispose();
    });

    watch(
      () => props.modelValue,
      () => {
        if (props.modelValue !== editor?.getValue()) {
          editor?.getModel()?.setValue(props.modelValue);
          editor?.setScrollPosition({ scrollTop: 0 });
        }
      },
    );
    return {
      editorElement,
      editorWrapper,
      onResize() {
        editor?.layout({ height: 0, width: 0 });
        window.setTimeout(() => {
          editor?.layout({
            height: (editorWrapper.value as HTMLElement).offsetHeight,
            width: (editorWrapper.value as HTMLElement).offsetWidth,
          });
        });
      },
    };
  },
});
</script>

<style scoped>
.editorWrapper {
  background-color: #1e1e1e;
}
</style>
