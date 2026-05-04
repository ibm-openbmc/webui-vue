<template>
  <div class="page-title">
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <h1>{{ title }}</h1>
        <p v-if="description">
          {{ description }}
          <router-link v-if="link" :to="to"> {{ link }} </router-link>
        </p>
      </div>
      <div v-if="$slots.actions" class="page-title-actions">
        <slot name="actions"></slot>
      </div>
    </div>
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
.page-title-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
