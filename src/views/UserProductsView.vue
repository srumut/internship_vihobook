<script setup>
    import { ref } from 'vue';
    import { navigateToAuthIfNotLoggedIn, parseCookies} from '@/assets/script/utility';
    import { useRouter } from 'vue-router';
    import Navbar from '@/components/user/Navbar.vue';

    navigateToAuthIfNotLoggedIn();

    const router = useRouter();
    function logout() {
        document.cookie = `authorization=; expires=${new Date(0).toUTCString()}; path=/`;
        document.cookie = `account=; expires=${new Date(0).toUTCString()}; path=/`;
        router.push("/auth");
    }

    const cookies = parseCookies();
    if (cookies["account"] === "admin") {
        router.push("/admin/dashboard")
    } else if (cookies["account"] !== "user") {
        logout();
    }

    const products = ref([]);
    fetch("/api/products", {
        headers: {
            "authorization": `Bearer ${cookies["authorization"]}`
        }
    }).then(async (res) => {
        const data = await res.json();
        if (res.ok) {
            products.value = data;
            return;
        }
        if (res.status === 401) {
            alert("Your session has been expired, please login");
            logout();
        }
        throw Error(data.message);
    }).catch((err) => {
        console.error(err);
    })
</script>

<template>
    <div class="w-dvw h-dvh flex flex-col py-[1vh] px-[2vw] border-x border-[var(--color-prussianblue)] md:w-[80vw] lg:w-[60vw] m-auto text-[var(--color-prussianblue)]">
        <Navbar />
        <div class="text-[var(--color-prussianblue)] px-[2vw] py-[1vw] w-full grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 content-start gap-x-[1vw] gap-y-[1vh]">
            <RouterLink :to="`/products/${product.id}`" :key="product.id" v-for="product in products" class="btn-pb-a rounded-sm overflow-clip py-2 px-1 flex flex-col gap-0.5">
                <span class="text-xl truncate">{{ product.name }}</span>
                <span class="text-xs">{{ product.category }}</span>
            </RouterLink>
        </div>
    </div>
</template>
