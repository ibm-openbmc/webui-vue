<template>
  <BContainer fluid="xl">
    {{ postCodes }}
  </BContainer>
</template>

<script>
import stores from '../../../store';
import { U64 } from 'n64';
import { Buffer } from 'buffer';
export default {
  name: 'PostCodes',
  data() {
    return {
      previousPostCode: '',
    };
  },
  computed: {
    postCodeValue() {
      return stores.GlobalStore().postCodeValueGetter;
    },
    postCodes: {
      get() {
        if (this.postCodeValue) {
          let finalConvertedCode = this.postCodeValue;
          // Filter out all non readable values and all 00000000
          // Yes, whitespaces for 'STANDBY ' and 'RUNTIME ' must be there
          if (finalConvertedCode === '00000000') {
            this.setPreviousPostCode('');
            return '';
          } else if (
            finalConvertedCode === 'STANDBY ' ||
            finalConvertedCode === 'RUNTIME ' ||
            /^[a-z0-9 ]+$/i.test(finalConvertedCode)
          ) {
            this.setPreviousPostCode(finalConvertedCode);
            return finalConvertedCode;
          } else {
            return this.previousPostCode;
          }
        } else {
          return '';
        }
      },
      set(value = '') {
        // Default value is an empty string
        // If the last character of the string value is a number
        // and that number isn't 9, then increment the value by 1
        if (
          /^[0-9]+$/i.test(value[value?.length - 1]) &&
          value[value?.length - 1] != '9'
        ) {
          // Take out the last character of the string
          // Increment the last character of the string by 1
          // Put the beginning and the ending of the string back together.
          // ex: '0132EDD5' will turn to '0132EDD6'
          this.previousPostCode =
            value.slice(0, -1) + (Number(value[value.length - 1]) + 1);
        }
      },
    },
  },
  methods: {
    setPreviousPostCode(finalConvertedCode) {
      this.previousPostCode = finalConvertedCode;
    },
  },
};
</script>
