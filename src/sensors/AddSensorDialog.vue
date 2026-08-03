<script setup lang="ts">
import AppNumberInput from '@/core/components/AppNumberInput.vue';
import Accordion from '@/core/components/ui/accordion/Accordion.vue';
import AccordionContent from '@/core/components/ui/accordion/AccordionContent.vue';
import AccordionItem from '@/core/components/ui/accordion/AccordionItem.vue';
import AccordionTrigger from '@/core/components/ui/accordion/AccordionTrigger.vue';
import Button from '@/core/components/ui/button/Button.vue';
import Field from '@/core/components/ui/field/Field.vue';
import FieldContent from '@/core/components/ui/field/FieldContent.vue';
import FieldDescription from '@/core/components/ui/field/FieldDescription.vue';
import FieldGroup from '@/core/components/ui/field/FieldGroup.vue';
import FieldLabel from '@/core/components/ui/field/FieldLabel.vue';
import FieldSet from '@/core/components/ui/field/FieldSet.vue';
import Label from '@/core/components/ui/label/Label.vue';
import NativeSelect from '@/core/components/ui/native-select/NativeSelect.vue';
import NativeSelectOption from '@/core/components/ui/native-select/NativeSelectOption.vue';
import Switch from '@/core/components/ui/switch/Switch.vue';
import { syncRefs } from '@vueuse/core';
import { nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';

const emit = defineEmits<{
  close: [value: { sensorId: number; vPin: number; pullUp: '1' | '0' } | undefined];
}>();

const sensorId = ref<number>(1);
const vPin = ref<number>(1);
const pullUp = ref<'1' | '0'>('1');
const vPinIsSensorId = ref<boolean>(true);

const syncSensorId = syncRefs(vPin, sensorId);
function addSensor(): void {
  emit('close', { sensorId: sensorId.value, vPin: vPin.value, pullUp: pullUp.value });
}

const firstInputRef = useTemplateRef('firstInputRef');

onMounted(async () => {
  await nextTick();
  firstInputRef.value?.$el.focus();
  firstInputRef.value?.$el.select();
});

watch(vPinIsSensorId, (newValue) => {
  if (newValue) {
    syncSensorId.resume();
  } else {
    syncSensorId.pause();
  }
});
</script>

<template>
  <form class="w-100 rounded-2xl bg-white p-8" @submit.prevent="addSensor">
    <h1 class="pb-6 text-xl font-semibold">{{ $t('components.addSensorDialog.addSensor') }}</h1>
    <FieldSet>
      <FieldGroup>
        <Field>
          <FieldContent>
            <FieldLabel for="vPin"> {{ $t('components.addSensorDialog.vPin') }} </FieldLabel>
          </FieldContent>
          <AppNumberInput id="vPin" v-model="vPin" :min="0" />
        </Field>
      </FieldGroup>
    </FieldSet>
    <Accordion collapsible class="mt-2 w-full">
      <AccordionItem value="advanced-options">
        <AccordionTrigger class="mb-2">{{
          $t('components.addSensorDialog.advancedOptions')
        }}</AccordionTrigger>
        <AccordionContent class="mb-2">
          <FieldSet>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel for="vPinIsSensorId">{{
                    $t('components.addSensorDialog.useVPinAsSensorId')
                  }}</FieldLabel>
                  <FieldDescription></FieldDescription>
                </FieldContent>
                <Switch id="vPinIsSensorId" v-model="vPinIsSensorId" />
              </Field>
              <Field v-if="!vPinIsSensorId" class="-mt-4">
                <FieldContent>
                  <FieldLabel for="sensorId">{{
                    $t('components.addSensorDialog.sensorId')
                  }}</FieldLabel>
                </FieldContent>
                <AppNumberInput id="sensorId" v-model="sensorId" :min="0" class="w-32" />
              </Field>
              <Field>
                <FieldContent>
                  <Label for="pullUp">{{ $t('components.addSensorDialog.pullUp') }}</Label>
                </FieldContent>
                <NativeSelect id="pullUp" v-model="pullUp">
                  <NativeSelectOption :value="'1'">{{ $t('global.yes') }}</NativeSelectOption>
                  <NativeSelectOption :value="'0'">{{ $t('global.no') }}</NativeSelectOption>
                </NativeSelect>
              </Field>
            </FieldGroup>
          </FieldSet>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <Field orientation="horizontal">
      <Button type="submit">
        {{ $t('globals.formActions.submit') }}
      </Button>
      <Button variant="outline" type="button" @click="emit('close', undefined)">{{
        $t('globals.formActions.cancel')
      }}</Button>
    </Field>
  </form>
</template>
