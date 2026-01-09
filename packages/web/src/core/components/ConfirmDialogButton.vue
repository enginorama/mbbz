<script setup lang="ts">
import { AlertDialogAction } from 'reka-ui';
import AlertDialog from './ui/alert-dialog/AlertDialog.vue';
import AlertDialogCancel from './ui/alert-dialog/AlertDialogCancel.vue';
import AlertDialogContent from './ui/alert-dialog/AlertDialogContent.vue';
import AlertDialogDescription from './ui/alert-dialog/AlertDialogDescription.vue';
import AlertDialogFooter from './ui/alert-dialog/AlertDialogFooter.vue';
import AlertDialogHeader from './ui/alert-dialog/AlertDialogHeader.vue';
import AlertDialogTitle from './ui/alert-dialog/AlertDialogTitle.vue';
import AlertDialogTrigger from './ui/alert-dialog/AlertDialogTrigger.vue';
import Button from './ui/button/Button.vue';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <slot></slot>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description">
          {{ description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction as-child>
          <Button variant="destructive">Continue</Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
