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
    const categories = ref({ok: false, error: null});

    fetch("/api/categories", {
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
        categories.value = {ok: true, data: data};
    }).catch((err) => {
        categories.value = {ok: false, error: err};
    })

    const deleteDialog = ref();
    const categoryIdToDelete = ref();

    function showDeleteModal(id) {
        error_message.value = "";
        categoryIdToDelete.value = id;
        deleteDialog.value.showModal();
    }

    function deleteCategory() {
        fetch(`/api/categories/${categoryIdToDelete.value}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`
            }
        }).then(async (res) => {
            if (res.ok) {
                for (let i = 0; i < categories.value.data.length; i++) {
                    if (categories.value.data[i].id === categoryIdToDelete.value) {
                        categories.value.data.splice(i, 1);
                        break;
                    }
                }
                deleteDialog.value.close();
                error_message.value = "";
            }
            if (res.status == 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            const data = await res.json();
            error_message.value = data.message;
        }).catch((err) => {
            console.error(err);
            deleteDialog.value.close();
            error_message.value = "";
        })
    }

    const categoryDialog = ref();
    const categoryDetailed = ref({id: ""});

    const updatedName = ref("");
    const updatedDescription = ref("");

    const error_message = ref("");

    function showCategoryInformation(category) {
        error_message.value = "";
        updatedName.value = category.name;
        updatedDescription.value = category.description;
        categoryDetailed.value = category;
        categoryDialog.value.showModal();
    }

    function updateCategory() {
        fetch(`/api/categories/${categoryDetailed.value.id}`, {
            method: "PATCH",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": updatedName.value,
                "description": updatedDescription.value
            })
        }).then(async (res) => {
            if (res.ok) {
                return res.json();
            }
            if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            const data = await res.json();
            if (res.status === 400) {
                error_message.value = data.message;
            }
            throw Error(data.message);
        }).then((data) => {
            for (let i = 0; i < categories.value.data.length; i++) {
                if (categories.value.data[i].id === data.id) {
                    categories.value.data[i] = data;
                    break;
                }
            }
            categoryDialog.value.close();
            error_message.value = "";
        }).catch((err) => {
            console.error(err);
        })
    }
    
    const addCateogryDialog = ref();

    function showAddCateogryDialog() {
        addCateogryDialog.value.showModal();
    }

    const addCateogryId = ref();
    const addCategoryName = ref();
    const addCategoryDescription = ref();

    function addCategory() {
        fetch("/api/categories", {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "id": addCateogryId.value,
                "name": addCategoryName.value,
                "description": addCategoryDescription.value
            })
        }).then(async (res) => {
            if (res.ok) {
                return res.json();
            } else if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            const data = await res.json();
            if (res.status === 400) {
                error_message.value = data.message;
            }
            throw Error(data.message);
        }).then((data) => {
            categories.value.data.push(data);
            addCateogryId.value = "";
            addCategoryName.value = "";
            addCategoryDescription.value = "";
            addCateogryDialog.value;
            error_message.value = "";
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
            <a @click="showAddCateogryDialog();" class="btn-j-b">Add New Category</a>
            <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="addCateogryDialog">
                <form @submit.prevent="addCategory();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                    <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                    <input class="input-pb" type="text" placeholder="ID" v-model="addCateogryId" required/>
                    <input class="input-pb" type="text" placeholder="Name" v-model="addCategoryName" required/>
                    <input class="input-pb" type="text" min="0" placeholder="Description" v-model="addCategoryDescription" required/>
                    <div class="flex gap-4">
                        <button type="submit" class="btn-j-b">Create</button>
                        <a @click="addCateogryDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                    </div>
                </form>
            </dialog>
        </div>
        <!--Users-->
        <div class="flex-grow w-full overflow-y-scroll h-full">
            <div v-if="categories === null">Loading...</div> 
            <div v-else-if="categories.ok" class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                    <thead>
                        <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                            <th></th>
                            <th class="px-2 py-1">ID</th>
                            <th class="px-2 py-1">Name</th>
                            <th class="px-2 py-1">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="category in categories.data" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                            <td class="flex justify-center">
                                <a @click="showDeleteModal(category.id);">
                                    <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                </a>
                            </td>
                            <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="showCategoryInformation(category)">{{ category.id }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showCategoryInformation(category)">{{ category.name }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showCategoryInformation(category)">{{ category.description }}</td>
                        </tr>
                    </tbody>
                </table>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteDialog">
                    <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <span class="flex flex-col items-center">
                            Do you want to delete the category with id 
                            <span>
                                <b>{{ categoryIdToDelete }} </b> ?
                            </span>
                        </span>
                        <div class="flex gap-4">
                            <a @click="deleteDialog.close(); error_message='';" class="btn-pb-b">Cancel</a>
                            <a @click="deleteCategory()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="categoryDialog">
                    <form @submit.prevent="updateCategory();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                            <table class="text-left">
                                <tbody>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">ID</th>
                                        <td class="py-1 px-2">{{ categoryDetailed.id }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Name</th>
                                        <td class="py-1 px-2">
                                            <input type="text" class="input-pb w-full" v-model="updatedName" required/>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Description</th>
                                        <td class="py-1 px-2">
                                            <input type="text" class="input-pb w-full" v-model="updatedDescription" required/>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Created At</th>
                                        <td class="py-1 px-2">{{ new Date(categoryDetailed.createdAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Updated At</th>
                                        <td class="py-1 px-2">{{ new Date(categoryDetailed.updatedAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="flex gap-4">
                            <button type="submit" class="btn-j-b">Save</button>
                            <a @click="categoryDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                        </div>
                    </form>
                </dialog>
            </div>
            <div v-else>
                {{ categories.error }}
            </div>
        </div>
    </div>
</template>