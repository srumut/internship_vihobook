<script setup>
    import { ref } from 'vue';
    import DeleteIcon from '@/components/DeleteIcon.vue';
    import { parseCookies } from '@/assets/script/utility';
    import { useRouter } from 'vue-router';

    const router = useRouter();
    function logout() {
        document.cookie = `authorization=; expires=${new Date(0).toUTCString()}; path=/`;
        document.cookie = `account=; expires=${new Date(0).toUTCString()}; path=/`;
        router.push("/auth");
    }

    const dateFormatOptions = {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const cookies = parseCookies();
    const users = ref(null);

    fetch("/api/users", {
        headers: {
            "authorization": `Bearer ${parseCookies()["authorization"]}`
        }
    }).then((res) => {
        if (res.status == 401) {
            alert("It seems your session has been expired, please login again!");
            logout();
        }
        return res.json();
    }).then((data) => {
        users.value = {ok: true, data: data};
    }).catch((err) => {
        users.value = {ok: false, error: err};
    })
    
    function getUserNamesById(id) {
        for (let user of users.value.data) {
            if (user.id === id) {
                return `${user.name} ${user.surname} (${user.username})`;
            }
        }
        return undefined;
    }
    
    const deleteDialog = ref();
    const userIdToDelete = ref();

    function showDeleteModal(id) {
        userIdToDelete.value = id;
        deleteDialog.value.showModal();
    }

    function deleteUser() {
        fetch(`/api/users/id/${userIdToDelete.value}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`
            }
        }).then((res) => {
            if (res.ok) {
                for (let i = 0; i < users.value.data.length; i++) {
                    if (users.value.data[i].id === userIdToDelete.value) {
                        users.value.data.splice(i, 1);
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
        error_message.value = "";
    }

    const userDialog = ref();
    const userDetailed = ref({id: "", username: "", name: "", surname: "", createdAt: "", updatedAt: "", orders: []});

    const updatedUsername = ref();
    const updatedName = ref();
    const updatedSurname = ref();
    const error_message = ref("");

    function showUserInformation(user) {
        error_message.value = "";
        updatedUsername.value = user.username;
        updatedName.value = user.name;
        updatedSurname.value = user.surname;
        userDetailed.value = user;
        userDialog.value.showModal();
    }

    function updateUser() {
        error_message.value = "";
        fetch(`/api/users/id/${userDetailed.value.id}`, {
            method: "PATCH",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": updatedName.value,
                "surname": updatedSurname.value,
                "username": updatedUsername.value
            })
        }).then(async (res) => {
            if (res.ok) {
                return res.json();
            }
            if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            else if (res.status === 400) {
                const data = await res.json();
                error_message.value = data.message;
            }
            const data = await res.json();
            throw new Error(data.message);
        }).then((data) => {
            for (let i = 0; i < users.value.data.length; i++) {
                if (users.value.data[i].id === data.id) {
                    users.value.data[i] = data;
                    break;
                }
            }
            userDialog.value.close();
            error_message.value = "";
        }).catch((err) => {
            console.error(err);
        })
    }
    
    const addUserDialog = ref();

    function showAddUserDialog() {
        addUserDialog.value.showModal();
    }

    const addUserName = ref();
    const addUserSurname = ref();
    const addUserUsername = ref();
    const addUserPassword = ref();

    function addUser() {
        fetch("/api/users", {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": addUserName.value,
                "surname": addUserSurname.value,
                "username": addUserUsername.value,
                "password": addUserPassword.value,
            })
        }).then(async (res) => {
            if (res.ok) {
                return res.json();
            }

            if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            else if (res.status === 400) {
                const data = await res.json();
                error_message.value = data.message;
            }
            const data = await res.json();
            throw new Error(data.message);
        }).then((data) => {
            users.value.data.push(data);
            addUserName.value = "";
            addUserSurname.value = "";
            addUserUsername.value = "";
            addUserPassword.value = "";
            addUserDialog.value.close();
            error_message.value = "";
        }).catch((err) => {
            console.error(err);
        })
    }

    const ordersDialog = ref();

    function showOrdersDialog() {
        fetch(`/api/users/u/${userDetailed.value.username}/orders`, {
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
            }
        }).then(async (res) => {
            const data = await res.json();
            if (res.ok) {
                userDetailed.value["orders"] = data;
                return;
            }
            else if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            throw Error(data.message);
        }).catch((err) => {
            console.error(err);
        })
        ordersDialog.value.showModal();
    }

    function getProductCountOfOrder(order) {
        let count = 0;
        for (let product of order.products) {
            count += product.count;
        }
        return count;
    }

    const deleteOrderDialog = ref();
    const orderIdToDelete = ref();

    function showDeleteOrderDialog(order_id) {
        orderIdToDelete.value = order_id;
        error_message.value = "";
        deleteOrderDialog.value.showModal();
    }

    function deleteOrder() {
        const order_id = orderIdToDelete.value;
        fetch(`/api/users/u/${userDetailed.value.username}/orders/${order_id}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
            }
        }).then(async (res) => {
            const data = await res.json();
            if (res.ok) {
                for (let i = 0; i < userDetailed.value.orders.length; i++) {
                    if (userDetailed.value.orders[i].order_id === order_id) {
                        userDetailed.value.orders.splice(i, 1);
                        deleteOrderDialog.value.close();
                        error_message.value = "";
                        return;
                    }
                }
            }
            else if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            error_message.value = data.message;
        }).catch((err) => {
            console.error(err);
        })
    }
</script> 

<template>
  <div class="flex-grow w-full flex flex-col gap-4">
        <!--Search and add user navbar-->
        <div class="w-full flex justify-end">
            <!-- TODO(umut): integrate search capability
            <form class="flex gap-[1vw]">
                <input class="input-pb w-min-100 w-[20vw]"></input>
                <a class="btn-pb-b">Search</a>
            </form>
            -->
            <a @click="showAddUserDialog();" class="btn-j-b">Add New User</a>
            <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="addUserDialog">
                <form @submit.prevent="addUser();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                    <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                    <input class="input-pb" type="text" placeholder="Name" v-model="addUserName" autocomplete="name" required/>
                    <input class="input-pb" type="text" placeholder="Surname" v-model="addUserSurname" autocomplete="family-name" required/>
                    <input class="input-pb" type="user" placeholder="Username" v-model="addUserUsername" autocomplete="username" required/>
                    <input class="input-pb" type="password" placeholder="Password" v-model="addUserPassword" autocomplete="new-password" required/>
                    <div class="flex gap-4">
                        <button type="submit" class="btn-j-b">Create</button>
                        <a @click="addUserDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                    </div>
                </form>
            </dialog>
        </div>
        <!--Users-->
        <div class="flex-grow w-full overflow-y-scroll h-full">
            <div v-if="users === null">Loading...</div> 
            <div v-else-if="users.ok" class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                    <thead>
                        <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                            <th></th>
                            <th class="px-2 py-1">ID</th>
                            <th class="px-2 py-1">Username</th>
                            <th class="px-2 py-1">Name</th>
                            <th class="px-2 py-1">Surname</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in users.data" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                            <td class="flex justify-center">
                                <a @click="showDeleteModal(user.id);">
                                    <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                </a>
                            </td>
                            <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="showUserInformation(user)">{{ user.id }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showUserInformation(user)">{{ user.username }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showUserInformation(user)">{{ user.name }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showUserInformation(user)">{{ user.surname }}</td>
                        </tr>
                    </tbody>
                </table>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteDialog">
                    <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                        <span class="flex flex-col items-center">
                            Do you want to delete the user with id 
                            <span :title="getUserNamesById(userIdToDelete)">
                                <b>{{ userIdToDelete }} </b> ?
                            </span>
                        </span>
                        <div class="flex gap-4">
                            <a @click="deleteDialog.close(); error_message='';" class="btn-pb-b">Cancel</a>
                            <a @click="deleteUser()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="userDialog">
                    <form @submit.prevent="updateUser();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                            <table class="text-left">
                                <tbody>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">ID</th>
                                        <td class="py-1 px-2">{{ userDetailed.id }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Username</th>
                                        <td class="py-1 px-2">
                                            <input id="username" class="input-pb w-full" v-model="updatedUsername" required></input>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Name</th>
                                        <td class="py-1 px-2">
                                            <input id="name" class="input-pb w-full" v-model="updatedName" required></input>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Surname</th>
                                        <td class="py-1 px-2">
                                            <input id="surname" class="input-pb w-full" v-model="updatedSurname" required></input>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Created At</th>
                                        <td class="py-1 px-2">{{ new Date(userDetailed.createdAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                    <tr class="">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Updated At</th>
                                        <td class="py-1 px-2">{{ new Date(userDetailed.updatedAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <a class="btn-uto-a w-full text-center" @click="showOrdersDialog();">Orders</a>
                        <div class="flex gap-4">
                            <a @click="userDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                            <button type="submit" class="btn-j-b">Save</button>
                        </div>
                    </form>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="ordersDialog">
                    <div class="flex flex-col gap-4 items-center">
                        <div class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                            <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                                <thead>
                                    <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                                        <th></th>
                                        <th class="px-2 py-1">Order ID</th>
                                        <th class="px-2 py-1">Ordered At</th>
                                        <th class="px-2 py-1">Product Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="order in userDetailed.orders" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                                        <td class="flex justify-center">
                                            <a @click="showDeleteOrderDialog(order.order_id)">
                                                <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                            </a>
                                        </td>
                                        <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="">{{ order.order_id }}</td>
                                        <td class="px-2 py-1 hover:cursor-pointer" @click="">{{ getProductCountOfOrder(order) }}</td>
                                        <td class="px-2 py-1 hover:cursor-pointer" @click="">{{ new Date(order.time).toLocaleString("tr-TR", dateFormatOptions) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <a @click="ordersDialog.close(); error_message='';" class="btn-pb-b">Cancel</a>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteOrderDialog">
                    <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                    <div class="w-full flex flex-col gap-4">
                        <span class="flex flex-col items-center">
                            Do you want to remove the order with id 
                            <b>{{ orderIdToDelete }}</b> ?
                        </span>
                        <div class="flex gap-4 justify-center">
                            <a @click="deleteOrderDialog.close()" class="btn-pb-b">Cancel</a>
                            <a @click="deleteOrder()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
            </div>
            <div v-else>
                {{ users.error }}
            </div>
        </div>
    </div>
</template>