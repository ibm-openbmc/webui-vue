<template>
  <div class="page-title">
    <h1>{{ title }}</h1>
    <p v-if="description">
      {{ description }}
      <BLink v-if="link" :to="to"> {{ link }} </BLink>
    </p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  link: {
    type: String,
    default: '',
  },
  to: {
    type: String,
    default: '',
  },
});
</script>

<style lang="scss" scoped>
.page-title {
  margin-bottom: $spacer * 2;
}
p {
  max-width: 72ch;
}
</style>
