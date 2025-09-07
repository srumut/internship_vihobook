<script setup>
    import { useRoute, useRouter } from 'vue-router';
    import { navigateToAuthIfNotLoggedIn, parseCookies, parseJwtPayload } from '@/assets/script/utility';
    import { ref } from 'vue';
import Navbar from '@/components/user/Navbar.vue';

    navigateToAuthIfNotLoggedIn();

    const router = useRouter();
    function logout() {
        document.cookie = `authorization=; expires=${new Date(0).toUTCString()}; path=/`;
        document.cookie = `account=; expires=${new Date(0).toUTCString()}; path=/`;
        router.push("/auth");
    }

    const cookies = parseCookies();
    const route = useRoute();
    const product_id = route.params.product_id;
    const product = ref({});

    fetch(`/api/products/${product_id}`, {
        headers: {
            "authorization": `Bearer ${cookies["authorization"]}`
        }
    }).then(async (res) => {
        const data = await res.json();
        if (res.ok) {
            product.value = data;
            return;
        } else if (res.status === 401) {
            alert("Your session has been expired, please login");
            logout();
        }
        throw Error(data.message);
    }).catch((err) => {
        console.error(err);
    })

    const jwt = parseJwtPayload(cookies["authorization"]);
    const username = jwt.username;

    const quantity = ref(0);

    function order() {
        fetch("/api/users/orders", {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify([{
                "product_id": product_id,
                "count": quantity.value
            }])
        }).then(async (res) => {
            if (res.ok) {
                product.value.stock -= quantity.value;
                quantity.value = 0;
                alert("ordered successfully");
                return;
            } else if (res.status === 401) {
                alert("Your session has been expired, please login");
                logout();
            }
            const data = await res.json();
            throw new Error(data.message);
        }).catch((err) => {
            console.error(err);
        })
    }
</script>

<template>
    <div class="w-dvw h-dvh py-[1vh] px-[2vw] border-x border-[var(--color-prussianblue)] md:w-[80vw] lg:w-[60vw] m-auto text-[var(--color-prussianblue)]">
        <Navbar />

        <div class="mt-4 mb-6">
            <h1 class="text-2xl font-semibold truncate">{{ product.name }}</h1>
            <div class="mt-1 flex gap-3 items-center text-sm text-gray-600">
                <span v-if="product.company" class="truncate">{{ product.company }}</span>
                -
                <span v-if="product.branch" class="truncate">{{ product.branch }}</span>
                -
                <span v-if="product.category" class="truncate">{{ product.category }}</span>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 p-4 border rounded-md box-border">
                <h2 class="text-lg font-medium mb-2">Product details</h2>
                <dl class="grid grid-cols-1 gap-y-2 gap-x-6 text-sm mb-2">
                    <div>
                        <dt class="text-xs text-gray-500">Category Description</dt>
                        <dd class="truncate">{{ product.category_description }}</dd>
                    </div>
                </dl>
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                    <div>
                        <dt class="text-xs text-gray-500">Category</dt>
                        <dd class="truncate">{{ product.category }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-gray-500">Branch</dt>
                        <dd class="truncate">{{ product.branch }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-gray-500">Company</dt>
                        <dd class="truncate">{{ product.company }}</dd>
                    </div>
                    <div>
                        <dt class="text-xs text-gray-500">Availability</dt>
                        <dd>
                            <span v-if="product.stock > 0" class="text-[var(--color-jade)] font-medium">In stock</span>
                            <span v-else class="text-[var(--color-cerise)] font-medium">No stock available</span>
                        </dd>
                    </div>
                </dl>
            </div>
    
            <div class="p-4 border rounded-md box-border flex flex-col gap-4 items-center">
                <div>
                    <h3 class="text-md font-medium">Order</h3>
                    <p class="text-xs text-gray-500 mt-1">Select amount and place an order.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="quantity--;" type="button" class="btn-pb-a px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer" :disabled="product.stock <= 0 || quantity <= 0">
                        −
                    </button>
                    <input type="number" class="w-20 text-center input-pb outline-none" readonly :disabled="product.stock <= 0" v-model="quantity"/>
                    <button @click="quantity++;" type="button" class="btn-pb-a px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer" :disabled="product.stock <= 0 || quantity >= product.stock">
                        ＋
                    </button>
                </div>
                <button @click="order()" type="button" class="btn-pb-b mt-2 w-full py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed" :disabled="product.stock <= 0">
                    Order
                </button>
            </div>
        </div>
    </div>
</template>

