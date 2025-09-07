<script setup>
    import { ref } from 'vue';
    import { navigateToAuthIfNotLoggedIn, parseCookies} from '@/assets/script/utility';
    import { useRouter } from 'vue-router';
    import Users from '@/components/admin_dashboard/Users.vue'
    import Admins from '@/components/admin_dashboard/Admins.vue'
    import Products from '@/components/admin_dashboard/Products.vue';
    import Categories from '@/components/admin_dashboard/Categories.vue';
    import Companies from '@/components/admin_dashboard/Companies.vue';
    import Branches from '@/components/admin_dashboard/Branches.vue';
    import Orders from '@/components/admin_dashboard/Orders.vue';

    navigateToAuthIfNotLoggedIn();

    const activetab = ref(0);
    const router = useRouter();
    
    function logout() {
        document.cookie = `authorization=; expires=${new Date(0).toUTCString()}; path=/`;
        document.cookie = `account=; expires=${new Date(0).toUTCString()}; path=/`;
        router.push("/auth");
    }

    const cookies = parseCookies();
    if (cookies["account"] === "user") {
        router.push("/products")
    } else if (cookies["account"] !== "admin") {
        logout();
    }

</script>

<template>
    <!--Sidebar-->
    <div class="h-dvh flex">
        <div class="h-dvh min-w-80 flex flex-col gap-2 py-[1vh] px-[1vw] text-center">
            <a @click="activetab = 1;" class="btn-pb-b h-fit">Users</a>
            <a @click="activetab = 2;" class="btn-pb-b h-fit">Admins</a>
            <a @click="activetab = 3;" class="btn-pb-b h-fit">Products</a>
            <a @click="activetab = 4;" class="btn-pb-b h-fit">Categories</a>
            <a @click="activetab = 5;" class="btn-pb-b h-fit">Companies</a>
            <a @click="activetab = 6;" class="btn-pb-b h-fit">Branches</a>
            <a @click="activetab = 7;" class="btn-pb-b h-fit">Orders</a>
            <a @click="logout" class="btn-c-b h-fit mt-auto">Logout</a>
        </div>
        <!--Dashboard Pane-->
        <div class="grow py-[1vh] px-[1vw]">
            <div v-if="activetab === 1" class="flex flex-col h-full">
                <Users></Users>
            </div>
            <div v-else-if="activetab === 2" class="flex flex-col h-full">
                <Admins></Admins>
            </div>
            <div v-else-if="activetab === 3" class="flex flex-col h-full">
                <Products></Products>
            </div>
            <div v-else-if="activetab === 4" class="flex flex-col h-full">
                <Categories></Categories>
            </div>
            <div v-else-if="activetab === 5" class="flex flex-col h-full">
                <Companies></Companies>
            </div>
            <div v-else-if="activetab === 6" class="flex flex-col h-full">
                <Branches></Branches>
            </div>
            <div v-else-if="activetab === 7" class="flex flex-col h-full">
                <Orders></Orders>
            </div>
        </div>
    </div>
</template>
