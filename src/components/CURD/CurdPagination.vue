<template>
  <Pagination
    v-show="state.total > 0"
    :total="state.total"
    :page="state.pageNum"
    @update:page="pageChangeHandler"
    :limit="state.pageSize"
    @update:limit="sizeChangeHandler"
  />
</template>

<script lang="ts">
export default {
  name: 'CurdPagination'
}
</script>

<script setup lang="ts">
import type { Curd } from './CURD'

interface Props {
  curd: Curd
}

const props = defineProps<Props>();
const { state, pageChangeHandler, sizeChangeHandler } =
  props.curd.usePagination();
</script>

<style scoped></style>
