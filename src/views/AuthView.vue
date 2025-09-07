<script setup>
    import { RouterLink } from 'vue-router';
    import { navigateToDashboardIfLoggedIn } from '@/assets/script/utility';

    navigateToDashboardIfLoggedIn(document.cookie);
</script>

<template>
    <div class="h-dvh flex items-center justify-center">
        <div class="mx-4 w-full sm:w-10/12 md:w-8/12 lg:w-6/12 xl:w-4/12 flex flex-col text-center gap-3">
            <RouterLink class="btn-j-b" to="/register">Register as User</RouterLink>
            <RouterLink class="btn-bg-b" to="/user/login">Login as User</RouterLink>
            <RouterLink class="btn-pb-b" to="/admin/login">Login as Admin</RouterLink>
        </div>
    </div>
</template>