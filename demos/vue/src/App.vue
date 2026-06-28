<template>
  <div>
    <h1>DumbQL + Vue</h1>
    <p v-if="loading">Loading...</p>
    <p v-else-if="error">Error: {{ error }}</p>
    <ul v-else>
      <li v-for="note in data?.getNotes" :key="note.id">
        <strong>{{ note.title }}</strong>: {{ note.content }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { gql, useQuery } from '@dumbql/vue';

const GET_NOTES = gql`
  query {
    getNotes {
      id
      title
      content
    }
  }
`;

const { data, loading, error } = useQuery(GET_NOTES);
</script>
