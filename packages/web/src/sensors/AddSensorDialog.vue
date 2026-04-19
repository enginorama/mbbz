<script setup lang="ts">
import Button from '@/core/components/ui/button/Button.vue';
import Field from '@/core/components/ui/field/Field.vue';
import FieldGroup from '@/core/components/ui/field/FieldGroup.vue';
import FieldLabel from '@/core/components/ui/field/FieldLabel.vue';
import FieldSet from '@/core/components/ui/field/FieldSet.vue';
import Label from '@/core/components/ui/label/Label.vue';
import NativeSelect from '@/core/components/ui/native-select/NativeSelect.vue';
import NativeSelectOption from '@/core/components/ui/native-select/NativeSelectOption.vue';
import NumberField from '@/core/components/ui/number-field/NumberField.vue';
import NumberFieldContent from '@/core/components/ui/number-field/NumberFieldContent.vue';
import NumberFieldDecrement from '@/core/components/ui/number-field/NumberFieldDecrement.vue';
import NumberFieldIncrement from '@/core/components/ui/number-field/NumberFieldIncrement.vue';
import NumberFieldInput from '@/core/components/ui/number-field/NumberFieldInput.vue';
import { nextTick, onMounted, ref, useTemplateRef } from 'vue';

const emit = defineEmits<{
  close: [value: { sensorId: number; vPin: number; pullUp: '1' | '0' } | undefined];
}>();

const sensorId = ref<number>(1);
const vPin = ref<number>(1);
const pullUp = ref<'1' | '0'>('1');

function addSensor(): void {
  emit('close', { sensorId: sensorId.value, vPin: vPin.value, pullUp: pullUp.value });
}

const firstInputRef = useTemplateRef('firstInputRef');

onMounted(async () => {
  await nextTick();
  firstInputRef.value?.$el.focus();
  firstInputRef.value?.$el.select();
});
</script>

<template>
  <form class="w-100 rounded-2xl bg-white p-8" @submit.prevent="addSensor">
    <FieldSet>
      <FieldGroup>
        <Field>
          <FieldLabel for="sensorId"> Sensor ID </FieldLabel>
          <NumberField id="sensorId" v-model="sensorId" :min="0" :focus-on-change="false">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput ref="firstInputRef" />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </Field>
        <Field>
          <FieldLabel for="vPin"> VPin </FieldLabel>
          <NumberField id="vPin" v-model="vPin" :min="0">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </Field>
        <Field>
          <Label for="pullUp"> Pull-up </Label>
          <NativeSelect id="pullUp" v-model="pullUp">
            <NativeSelectOption :value="'1'">Yes</NativeSelectOption>
            <NativeSelectOption :value="'0'">No</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field orientation="horizontal">
          <Button type="submit"> Submit </Button>
          <Button variant="outline" type="button" @click="emit('close', undefined)">
            Cancel
          </Button>
        </Field>
      </FieldGroup>
    </FieldSet>
  </form>
</template>
