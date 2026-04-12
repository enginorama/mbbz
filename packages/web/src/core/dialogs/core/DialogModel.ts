import type { Component } from 'vue';

export type DialogModel = {
  id: number;
  component: Component;
  attrs: Record<string, unknown>;
  onClose: (value: unknown) => void;
};
