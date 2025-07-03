<template>
  <div class="project-info">
    <q-separator spaced />
    <q-item dense>
      <q-item-section>
        <div class="row q-gutter-xs items-center">
          <q-btn
            flat
            dense
            size="sm"
            :label="`v${appVersion}`"
            class="project-link-btn"
            :href="
              Platform.is.electron
                ? undefined
                : `https://github.com/bfritscher/typesense-dashboard/releases/tag/v${appVersion}`
            "
            target="_blank"
            rel="noopener noreferrer"
            @click="
              Platform.is.electron
                ? openLink(
                    `https://github.com/bfritscher/typesense-dashboard/releases/tag/v${appVersion}`,
                  )
                : undefined
            "
          />
          <q-btn
            flat
            dense
            size="sm"
            class="project-link-btn"
            :href="
              Platform.is.electron ? undefined : 'https://github.com/bfritscher/typesense-dashboard'
            "
            target="_blank"
            rel="noopener noreferrer"
            @click="
              Platform.is.electron
                ? openLink('https://github.com/bfritscher/typesense-dashboard')
                : undefined
            "
          >
            <template #default>
              <span class="github-icon">
                <img :src="githubIcon" alt="GitHub" />
              </span>
              <span class="block">GitHub</span>
            </template>
          </q-btn>
          <q-btn
            flat
            dense
            size="sm"
            icon="sym_s_bug_report"
            label="Issues"
            class="project-link-btn"
            :href="
              Platform.is.electron
                ? undefined
                : 'https://github.com/bfritscher/typesense-dashboard/issues'
            "
            target="_blank"
            rel="noopener noreferrer"
            @click="
              Platform.is.electron
                ? openLink('https://github.com/bfritscher/typesense-dashboard/issues')
                : undefined
            "
          />
        </div>
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup lang="ts">
import { Platform } from 'quasar';
import githubIcon from '../assets/github-mark.svg';

const appVersion = process.env.APP_VERSION || '0.0.0';

const openLink = (url: string) => {
  if (Platform.is.electron) {
    // Open in external browser when in Electron mode
    const electron = (window as any).electron;
    if (electron && electron.openExternal) {
      electron.openExternal(url);
    }
  } else {
    // Open in same window/tab when in web mode
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
</script>

<style scoped>
.project-info {
  margin-top: auto;
}

.project-link-btn {
  font-size: 0.75rem;
  text-transform: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.project-link-btn:hover {
  opacity: 1;
}

.github-icon {
  width: 1.715em;
  height: 1.715em;
  transition: filter 0.2s;
  margin-right: 6px;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: 4px;
}
.github-icon img {
  width: 100%;
  height: 100%;
  display: block;
}

/* Light theme - invert the black icon to make it visible */
.github-icon img {
  filter: invert(0.6);
}

/* Dark theme */
.project-link-btn {
  color: rgba(255, 255, 255, 0.7);
}

.project-link-btn:hover {
  color: rgba(255, 255, 255, 0.9);
}
</style>
