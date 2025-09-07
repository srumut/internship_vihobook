<script setup>
    import { ref } from 'vue';
    import DeleteIcon from '@/components/DeleteIcon.vue';
    import { parseCookies, parseJwtPayload } from '@/assets/script/utility';
    import { useRouter } from 'vue-router';
    import Navbar from '@/components/user/Navbar.vue'

    const router = useRouter();
    function logout() {
        document.cookie = `authorization=; expires=${new Date(0).toUTCString()}; path=/`;
        document.cookie = `account=; expires=${new Date(0).toUTCString()}; path=/`;
        router.push("/auth");
    }

    const cookies = parseCookies();
    const jwt = parseJwtPayload(cookies["authorization"]);
    const username = jwt["username"];
    const orders = ref([]);

    const dateFormatOptions = {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    fetch(`/api/users/u/${username}/orders`, {
        headers: {
            "authorization": `Bearer ${parseCookies()["authorization"]}`
        }
    }).then(async (res) => {
        if (res.ok) {
            return res.json();
        }
        if (res.status == 401) {
            alert("It seems your session has been expired, please login again!");
            logout();
        }
        const data = await res.json();
        console.error(data);
        throw new Error(data.message);
    }).then((data) => {
        orders.value = {ok: true, data: data};
    }).catch((err) => {
        orders.value = {ok: false, error: err};
    })
    
    const deleteDialog = ref();
    const orderToDelete = ref({id: ""});

    function showDeleteModal(order) {
        orderToDelete.value = order;
        deleteDialog.value.showModal();
    }

    function deleteOrder() {
        const order_id = orderToDelete.value.order_id;
        fetch(`/api/users/u/${username}/orders/${order_id}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`
            }
        }).then((res) => {
            if (res.ok) {
                for (let i = 0; i < orders.value.data.length; i++) {
                    if (orders.value.data[i].order_id === orderToDelete.value.order_id) {
                        orders.value.data.splice(i, 1);
                        break;
                    }
                }
            }
            if (res.status == 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            
        }).catch((err) => {
            console.error(err);
        })
        deleteDialog.value.close();
    }

    const orderDialog = ref();
    const orderDetailed = ref({id: ""});

    const error_message = ref("");

    function showOrderInformation(order) {
        error_message.value = "";
        orderDetailed.value = order;
        orderDialog.value.showModal();
    }
</script> 

<template>
    <div class="w-dvw h-dvh py-[1vh] px-[2vw] border-x border-[var(--color-prussianblue)] md:w-[80vw] lg:w-[60vw] m-auto text-[var(--color-prussianblue)]">
        <Navbar />
        <div class="flex-grow w-full flex flex-col gap-4">
            <!--Search and add admin navbar-->
            <div class="w-full flex justify-end">
                <!-- TODO(umut): integrate search capability
                <form class="flex gap-[1vw]">
                    <input class="input-pb w-min-100 w-[20vw]"></input>
                    <a class="btn-pb-b">Search</a>
                </form>
                -->
            </div>
            <!--Admins-->
            <div class="flex-grow w-full overflow-y-scroll h-full">
                <div v-if="orders === null">Loading...</div> 
                <div v-else-if="orders.ok" class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                    <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                        <thead>
                            <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                                <th></th>
                                <th class="px-2 py-1">Order ID</th>
                                <th class="px-2 py-1">Ordered At</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in orders.data" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                                <td class="flex justify-center">
                                    <a @click="showDeleteModal(order);">
                                        <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                    </a>
                                </td>
                                <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="showOrderInformation(order)">{{ order.order_id }}</td>
                                <td class="px-2 py-1 hover:cursor-pointer" @click="showOrderInformation(order)">{{ new Date(order.time).toLocaleString("tr-TR", dateFormatOptions) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteDialog">
                        <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                            <span class="flex flex-col items-center">
                                Do you want to delete the order with id 
                                    <span> <b>{{ orderToDelete.order_id }} </b> ? </span>
                            </span>
                            <div class="flex gap-4">
                                <a @click="deleteDialog.close();" class="btn-pb-b">Cancel</a>
                                <a @click="deleteOrder()" class="btn-c-b">Delete</a>
                            </div>
                        </div>
                    </dialog>
                    <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="orderDialog">
                        <div class="flex flex-col gap-[1vh]">
                            <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                                <table class="text-left">
                                    <tbody>
                                        <tr class="border-b border-[var(--color-prussianblue)]">
                                            <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Order ID</th>
                                            <td class="py-1 px-2">{{ orderDetailed.order_id }}</td>
                                        </tr>
                                        <tr class="border-b border-[var(--color-prussianblue)]">
                                            <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Ordered At</th>
                                            <td class="py-1 px-2">{{ new Date(orderDetailed.time).toLocaleString("tr-TR") }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                                <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                                    <thead>
                                        <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                                            <th class="px-2 py-1">Product ID</th>
                                            <th class="px-2 py-1">Product Name</th>
                                            <th class="px-2 py-1">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="product in orderDetailed.products" class="not-last:border-b-1 h-fit">
                                            <td class="px-2 py-1">{{ product.product_id }}</td>
                                            <td class="px-2 py-1">{{ product.product }}</td>
                                            <td class="px-2 py-1">{{ product.count }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <a @click="orderDialog.close();" class="btn-pb-b w-fit mx-auto">Close</a>
                        </div>
                    </dialog>
                </div>
                <div v-else>
                    {{ orders.error }}
                </div>
            </div>
        </div>
    </div>
</template>