import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useI18n } from 'vue-i18n';

export const useCvInfo = (address: MaybeRefOrGetter<number>) => {
  const { t, te } = useI18n();
  return computed(() => {
    const tk = `cvs.info.${toValue(address)}`;
    if (!te(tk)) {
      return null;
    }
    return t(`cvs.info.${toValue(address)}`);
  });
};
