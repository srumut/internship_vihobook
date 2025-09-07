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

    const cookies = parseCookies();
    const admins = ref(null);

    fetch("/api/admins", {
        headers: {
            "authorization": `Bearer ${parseCookies()["authorization"]}`
        }
    }).then(async (res) => {
        if (res.ok) {
            return res.json();
        }
        else if (res.status == 401) {
            alert("It seems your session has been expired, please login again!");
            logout();
        }
        const data = await res.json();
        console.error(data);
        throw new Error(data.message);
    }).then((data) => {
        admins.value = {ok: true, data: data};
    }).catch((err) => {
        admins.value = {ok: false, error: err};
    })
    
    const deleteDialog = ref();
    const adminIdToDelete = ref();

    function showDeleteModal(id) {
        adminIdToDelete.value = id;
        deleteDialog.value.showModal();
    }

    function deleteAdmin() {
        fetch(`/api/admins/${adminIdToDelete.value}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`
            }
        }).then((res) => {
            if (res.ok) {
                for (let i = 0; i < admins.value.data.length; i++) {
                    if (admins.value.data[i].id === adminIdToDelete.value) {
                        admins.value.data.splice(i, 1);
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

    const adminDialog = ref();
    const adminDetailed = ref({id: "", username: "", createdAt: "", updatedAt: ""});

    const updatedUsername = ref();
    const error_message = ref("");

    function showAdminInformation(admin) {
        error_message.value = "";
        updatedUsername.value = admin.username;
        adminDetailed.value = admin;
        adminDialog.value.showModal();
    }

    function updateAdmin() {
        error_message.value = "";
        fetch(`/api/admins/${adminDetailed.value.id}`, {
            method: "PATCH",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
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
            console.error(res);
        }).then((data) => {
            for (let i = 0; i < admins.value.data.length; i++) {
                if (admins.value.data[i].id === data.id) {
                    admins.value.data[i] = data;
                    break;
                }
            }
            adminDialog.value.close();
        }).catch((err) => {
            console.error(err);
        })
    }
    
    const addAdminDialog = ref();

    function showAddAdminDialog() {
        addAdminDialog.value.showModal();
    }

    const addAdminUsername = ref();
    const addAdminPassword = ref();

    function addAdmin() {
        fetch("/api/admins", {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": addAdminUsername.value,
                "password": addAdminPassword.value,
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
            console.warn(res);
            return;
        }).then((data) => {
            admins.value.data.push(data);
            addAdminUsername.value = "";
            addAdminPassword.value = "";
            addAdminDialog.value.close();
        }).catch((err) => {
            console.error(err);
        })
    }
</script> 

<template>
  <div class="flex-grow w-full flex flex-col gap-4">
        <!--Search and add admin navbar-->
        <div class="w-full flex justify-end">
            <!-- TODO(umut): integrate search capability
            <form class="flex gap-[1vw]">
                <input class="input-pb w-min-100 w-[20vw]"></input>
                <a class="btn-pb-b">Search</a>
            </form>
            -->
            <a @click="showAddAdminDialog();" class="btn-j-b">Add New Admin</a>
            <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="addAdminDialog">
                <form @submit.prevent="addAdmin();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                    <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                    <input class="input-pb" type="user" placeholder="Username" v-model="addAdminUsername" autocomplete="username" required/>
                    <input class="input-pb" type="password" placeholder="Password" v-model="addAdminPassword" autocomplete="new-password" required/>
                    <div class="flex gap-4">
                        <button type="submit" class="btn-j-b">Create</button>
                        <a @click="addAdminDialog.close();" class="btn-pb-b">Close</a>
                    </div>
                </form>
            </dialog>
        </div>
        <!--Admins-->
        <div class="flex-grow w-full overflow-y-scroll h-full">
            <div v-if="admins === null">Loading...</div> 
            <div v-else-if="admins.ok" class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                    <thead>
                        <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                            <th></th>
                            <th class="px-2 py-1">ID</th>
                            <th class="px-2 py-1">Username</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="admin in admins.data" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                            <td class="flex justify-center">
                                <a @click="showDeleteModal(admin.id);">
                                    <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                </a>
                            </td>
                            <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="showAdminInformation(admin)">{{ admin.id }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showAdminInformation(admin)">{{ admin.username }}</td>
                        </tr>
                    </tbody>
                </table>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteDialog">
                    <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                        <span class="flex flex-col items-center">
                            Do you want to delete the admin with id 
                                <span> <b>{{ adminIdToDelete }} </b> ? </span>
                        </span>
                        <div class="flex gap-4">
                            <a @click="deleteDialog.close();" class="btn-pb-b">Cancel</a>
                            <a @click="deleteAdmin()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="adminDialog">
                    <form @submit.prevent="updateAdmin();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                            <table class="text-left">
                                <tbody>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">ID</th>
                                        <td class="py-1 px-2">{{ adminDetailed.id }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Username</th>
                                        <td class="py-1 px-2">
                                            <input id="username" class="input-pb w-full" v-model="updatedUsername" required></input>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Created At</th>
                                        <td class="py-1 px-2">{{ new Date(adminDetailed.createdAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                    <tr class="">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Updated At</th>
                                        <td class="py-1 px-2">{{ new Date(adminDetailed.updatedAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="flex gap-4">
                            <button type="submit" class="btn-j-b">Save</button>
                            <a @click="adminDialog.close();" class="btn-pb-b">Close</a>
                        </div>
                    </form>
                </dialog>
            </div>
            <div v-else>
                {{ admins.error }}
            </div>
        </div>
    </div>
</template>