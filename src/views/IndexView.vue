<script setup>
    import { useRouter } from 'vue-router';
    import { parseCookies } from '@/assets/script/utility';

    const router = useRouter();
    const cookies = parseCookies(document.cookie);

    if (!(cookies?.["authorization"]) || !(cookies?.["account"])) { router.push("/auth"); }

    if (cookies["account"] == "user") { router.push("/products"); }
    if (cookies["account"] == "admin") { router.push("/admin/dashboard"); }

    router.push("/auth");

</script>

<template></template>
