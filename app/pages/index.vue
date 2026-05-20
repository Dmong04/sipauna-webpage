<template>
  <div />
</template>

<script lang="ts" setup>
const auth = useAuthStore()

definePageMeta({
  ssr: false,
  middleware: 'auth'
})
</script>