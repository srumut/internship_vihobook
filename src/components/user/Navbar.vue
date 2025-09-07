<script setup>
    import { RouterLink } from 'vue-router';
    import { useRouter } from 'vue-router';

    const router = useRouter();

    function logout() {
        document.cookie = `authorization=; expires=${new Date(0).toUTCString()}; path=/`;
        document.cookie = `account=; expires=${new Date(0).toUTCString()}; path=/`;
        router.push("/auth");
    }
</script>

<template>
    <nav class="py-[1vh] px-[2vw] w-full flex justify-between bg-[var(--color-bluegreen)]/5">
        <RouterLink to="/products" class="btn-bg-b">Products</RouterLink>
        <RouterLink to="/orders" class="btn-uto-b">Orders</RouterLink>
        <a @click="logout()" class="btn-c-b">Logout</a>
    </nav>
</template>
