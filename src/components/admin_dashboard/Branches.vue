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
    const branches = ref(null);

    fetch("/api/companies/branches", {
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
        branches.value = {ok: true, data: data};
        for (let i = 0; i < data.length; i++) {
            branches.value.data[i]["company"] = {
                "id": "unknown", 
                "name": "unknown",
                "createdAt": "unknown",
                "updatedAt": "unknown"
            };
            fetch(`/api/companies/${data[i].company_id}`, {
                headers: {
                    "authorization": `Bearer ${cookies["authorization"]}`
                }
            }).then(async (res) => {
                if (res.ok) {
                    branches.value.data[i]["company"] = await res.json();
                }
                else if (res.status === 401) {
                    alert("It seems your session has been expired, please login again!");
                    logout();
                }
            })
        }
    }).catch((err) => {
        branches.value = {ok: false, error: err};
    })
    
    const deleteDialog = ref();
    const branchIdToDelete = ref();

    function showDeleteModal(id) {
        error_message.value = '';
        branchIdToDelete.value = id;
        deleteDialog.value.showModal();
    }

    function deleteBranch() {
        fetch(`/api/companies/branches/${branchIdToDelete.value}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`
            }
        }).then((res) => {
            if (res.ok) {
                for (let i = 0; i < branches.value.data.length; i++) {
                    if (branches.value.data[i].id === branchIdToDelete.value) {
                        branches.value.data.splice(i, 1);
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
        error_message.value = '';
    }

    const branchDialog = ref();
    const branchDetailed = ref({id: "", company: {name: ""}});

    const updatedName = ref();
    const updatedCompanyId = ref();
    const error_message = ref("");

    function showBranchInformation(branch) {
        error_message.value = "";
        updatedName.value = branch.name;
        updatedCompanyId.value = branch.company.id;
        branchDetailed.value = branch;
        branchDialog.value.showModal();
    }

    function updateBranch() {
        error_message.value = "";
        fetch(`/api/companies/branches/${branchDetailed.value.id}`, {
            method: "PATCH",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": updatedName.value,
                "company_id": updatedCompanyId.value
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
            throw (await res.json()).message;
        }).then((data) => {
            for (let i = 0; i < branches.value.data.length; i++) {
                if (branches.value.data[i].id === data.id) {
                    Object.assign(branches.value.data[i], data);
                    break;
                }
            }
            branchDialog.value.close();
            error_message.value = '';
        }).catch((err) => {
            console.error(err);
        })
    }
    
    const addBranchDialog = ref();

    function showAddBranchDialog() {
        error_message.value = '';
        addBranchDialog.value.showModal();
    }

    const addBranchName = ref();
    const addBranchCompanyId = ref();

    function addBranch() {
        fetch("/api/companies/branches", {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": addBranchName.value,
                "company_id": addBranchCompanyId.value
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
            else if (res.status === 404) {
                const data = await res.json();
                error_message.value = data.message;
            }
            throw new Error((await res.json()).message);
        }).then((data) => {
            // retrieve the company info and add it to the branch info
            fetch(`/api/companies/${data.company_id}`, {
                headers: {
                    "authorization": `Bearer ${cookies["authorization"]}`
                }
            }).then(async (res) => {
                if (res.ok) {
                    data["company"] = await res.json();
                    branches.value.data.push(data);
                }
            })
            addBranchName.value = "";
            addBranchDialog.value.close();
            error_message.value = '';
        }).catch((err) => {
            console.error(err);
        })
    }

    const categoriesDialog = ref();
    const categoriesOfDetailedBranch = ref([]);

    function showCategoriesOfDetailedBranch() {
        categoriesOfDetailedBranch.value = [];
        error_message.value = "";
        fetch(`/api/companies/branches/${branchDetailed.value.id}/categories`, {
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
            }
        }).then(async (res) => {
            const data = await res.json();
            if (res.ok) {
                categoriesOfDetailedBranch.value = data;
                return;
            }
            else if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            error_message.value = data.message;
        })
        categoriesDialog.value.showModal();
    }

    const removeCategoryFromBranchDialog = ref();
    const categoryIdToDeleteFromBranch = ref();

    function showRemoveCategoryFromBranchDialog(id) {
        error_message.value = '';
        categoryIdToDeleteFromBranch.value = id;
        removeCategoryFromBranchDialog.value.showModal();
    }

    function removeCategoryFromBranch() {
        const id = categoryIdToDeleteFromBranch.value;
        fetch(`/api/companies/branches/${branchDetailed.value.id}/categories/${id}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
            }
        }).then((res) => {
            if (res.ok) {
                for (let i = 0; i < categoriesOfDetailedBranch.value.length; i++) {
                    if (categoriesOfDetailedBranch.value[i].id === id) {
                        categoriesOfDetailedBranch.value.splice(i, 1);
                        removeCategoryFromBranchDialog.value.close();
                        error_message.value = '';
                        return;
                    }
                }
            }
            if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
        })
    }

    const addCategoryToBranchDialog = ref();

    function showAddCategoryToBranchDialog() {
        error_message.value = '';
        addCategoryToBranchDialog.value.showModal();
    }

    const addCategoryId = ref();

    function addCategoryToBranch() {
        fetch(`/api/companies/branches/${branchDetailed.value.id}/categories/${addCategoryId.value}`, {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
            }
        }).then(async (res) => {
            if (res.ok) {
                categoriesOfDetailedBranch.value.push(await res.json());
                addCategoryToBranchDialog.value.close();
                error_message.value = '';
                return;
            }
            if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            error_message.value = (await res.json()).message;
        }).catch((err) => {
            console.error(err);
        })
    }
</script> 

<template>
  <div class="flex-grow w-full flex flex-col gap-4">
        <!-- add company navbar -->
        <div class="w-full flex justify-end">
            <!-- TODO(umut): integrate search capability
            <form class="flex gap-[1vw]">
                <input class="input-pb w-min-100 w-[20vw]"></input>
                <a class="btn-pb-b">Search</a>
            </form>
            -->
            <a @click="showAddBranchDialog();" class="btn-j-b">Add New Branch</a>
            <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="addBranchDialog">
                <form @submit.prevent="addBranch();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                    <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                    <input class="input-pb" type="text" placeholder="Branch Name" v-model="addBranchName" required/>
                    <input class="input-pb" type="text" placeholder="Company ID" v-model="addBranchCompanyId" required/>
                    <div class="flex gap-4">
                        <button type="submit" class="btn-j-b">Create</button>
                        <a @click="addBranchDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                    </div>
                </form>
            </dialog>
        </div>
        <!--Companies-->
        <div class="flex-grow w-full overflow-y-scroll h-full">
            <div v-if="branches === null">Loading...</div> 
            <div v-else-if="branches.ok" class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                    <thead>
                        <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                            <th></th>
                            <th class="px-2 py-1">ID</th>
                            <th class="px-2 py-1">Name</th>
                            <th class="px-2 py-1">Company Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="branch in branches.data" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                            <td class="flex justify-center">
                                <a @click="showDeleteModal(branch.id);">
                                    <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                </a>
                            </td>
                            <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="showBranchInformation(branch)">{{ branch.id }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showBranchInformation(branch)">{{ branch.name }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showBranchInformation(branch)">{{ branch.company.name }}</td>
                        </tr>
                    </tbody>
                </table>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteDialog">
                    <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                        <span class="flex flex-col items-center">
                            Do you want to delete the branch with id 
                            <span>
                                <b>{{ branchIdToDelete }} </b> ?
                            </span>
                        </span>
                        <div class="flex gap-4">
                            <a @click="deleteDialog.close(); error_message='';" class="btn-pb-b">Cancel</a>
                            <a @click="deleteBranch()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="branchDialog">
                    <form @submit.prevent="updateBranch();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                            <table class="text-left">
                                <tbody>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">ID</th>
                                        <td class="py-1 px-2">{{ branchDetailed.id }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Name</th>
                                        <td class="py-1 px-2">
                                            <input id="name" class="input-pb w-full" v-model="updatedName" required></input>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Company ID</th>
                                        <td class="py-1 px-2">
                                            <input id="company_id" class="input-pb w-full" v-model="updatedCompanyId" required></input>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Company Name</th>
                                        <td class="py-1 px-2">{{ branchDetailed.company.name }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Created At</th>
                                        <td class="py-1 px-2">{{ new Date(branchDetailed.createdAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                    <tr class="">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Updated At</th>
                                        <td class="py-1 px-2">{{ new Date(branchDetailed.updatedAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <a @click="showCategoriesOfDetailedBranch()" class="w-full btn-uto-a text-center">Categories</a>
                        <div class="flex gap-4">
                            <button type="submit" class="btn-j-b">Save</button>
                            <a @click="branchDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                        </div>
                    </form>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="categoriesDialog">
                    <div class="flex flex-col gap-4 items-center">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <a @click="showAddCategoryToBranchDialog();" class="btn-j-b m-0 ml-auto">Add New Category</a>
                        <div class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
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
                                    <tr v-for="category in categoriesOfDetailedBranch" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                                        <td class="flex justify-center">
                                            <a @click="showRemoveCategoryFromBranchDialog(category.id);">
                                                <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                            </a>
                                        </td>
                                        <td class="px-2 py-1 border-l-1 border-[var(--color-prussianblue)]">{{ category.id }}</td>
                                        <td class="px-2 py-1">{{ category.name }}</td>
                                        <td class="px-2 py-1">{{ category.description }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <a @click="categoriesDialog.close(); error_message='';" class="btn-pb-b w-fit">Close</a>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="removeCategoryFromBranchDialog">
                    <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                        <span class="flex flex-col items-center">
                            Do you want to remove the category with id 
                            <b>{{ categoryIdToDeleteFromBranch }} </b> 
                            <span>
                                from the branch ?
                            </span>
                        </span>
                        <div class="flex gap-4">
                            <a @click="removeCategoryFromBranchDialog.close(); error_message='';" class="btn-pb-b">Cancel</a>
                            <a @click="removeCategoryFromBranch()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="addCategoryToBranchDialog">
                    <form @submit.prevent="addCategoryToBranch();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <input class="input-pb" type="text" placeholder="Category ID" v-model="addCategoryId" required/>
                        <div class="flex gap-4">
                            <button type="submit" class="btn-j-b">Add</button>
                            <a @click="addCategoryToBranchDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                        </div>
                    </form>
                </dialog>
            </div>
            <div v-else>
                {{ branches.error }}
            </div>
        </div>
    </div>
</template>