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
    const companies = ref(null);

    fetch("/api/companies", {
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
        companies.value = {ok: true, data: data};
    }).catch((err) => {
        companies.value = {ok: false, error: err};
    })
    
    const deleteDialog = ref();
    const companyIdToDelete = ref();

    function showDeleteModal(id) {
        companyIdToDelete.value = id;
        deleteDialog.value.showModal();
    }

    const error_message = ref("");
    function deleteCompany() {
        fetch(`/api/companies/${companyIdToDelete.value}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`
            }
        }).then(async (res) => {
            if (res.ok) {
                for (let i = 0; i < companies.value.data.length; i++) {
                    if (companies.value.data[i].id === companyIdToDelete.value) {
                        companies.value.data.splice(i, 1);
                        error_message.value = "";
                        deleteDialog.value.close();
                        return;
                    }
                }
            } else if (res.status == 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            const data = await res.json();
            error_message.value = data.message;
            throw new Error(data.message);
        }).catch((err) => {
            console.error(err);
        })
    }

    const companyDialog = ref();
    const companyDetailed = ref({id: ""});

    const updatedName = ref();

    function showCompanyInformation(company) {
        error_message.value = "";
        updatedName.value = company.name;
        companyDetailed.value = company;
        companyDialog.value.showModal();
    }

    function updateCompany() {
        error_message.value = "";
        fetch(`/api/companies/${companyDetailed.value.id}`, {
            method: "PATCH",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": updatedName.value,
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
            for (let i = 0; i < companies.value.data.length; i++) {
                if (companies.value.data[i].id === data.id) {
                    companies.value.data[i] = data;
                    break;
                }
            }
            companyDialog.value.close();
            error_message.value = "";
        }).catch((err) => {
            console.error(err);
        })
    }
    
    const addCompanyDialog = ref();

    function showAddCompanyDialog() {
        addCompanyDialog.value.showModal();
    }

    const addCompanyName = ref();

    function addCompany() {
        fetch("/api/companies", {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": addCompanyName.value,
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
            companies.value.data.push(data);
            addCompanyName.value = "";
            addCompanyDialog.value.close();
            error_message.value = "";
        }).catch((err) => {
            console.error(err);
        })
    }

    const branchesDialog = ref();
    const branchesOfDetailedCompany = ref([]);

    function showBranchesOfDetailedCompany() {
        branchesOfDetailedCompany.value = [];
        error_message.value = "";
        fetch(`/api/companies/branches`, {
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
            }
        }).then(async (res) => {
            const data = await res.json();
            if (res.ok) {
                for (let branch of data) {
                    if (branch["company_id"] === companyDetailed.value.id) {
                        branchesOfDetailedCompany.value.push(branch);
                    }
                }
                return;
            }
            else if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            error_message.value = data.message;
        })
        branchesDialog.value.showModal();
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
            <a @click="showAddCompanyDialog();" class="btn-j-b">Add New Company</a>
            <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="addCompanyDialog">
                <form @submit.prevent="addCompany();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                    <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                    <input class="input-pb" type="text" placeholder="Name" v-model="addCompanyName" autocomplete="name" required/>
                    <div class="flex gap-4">
                        <button type="submit" class="btn-j-b">Create</button>
                        <a @click="addCompanyDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                    </div>
                </form>
            </dialog>
        </div>
        <!--Companies-->
        <div class="flex-grow w-full overflow-y-scroll h-full">
            <div v-if="companies === null">Loading...</div> 
            <div v-else-if="companies.ok" class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                    <thead>
                        <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                            <th></th>
                            <th class="px-2 py-1">ID</th>
                            <th class="px-2 py-1">Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="company in companies.data" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                            <td class="flex justify-center">
                                <a @click="showDeleteModal(company.id);">
                                    <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                </a>
                            </td>
                            <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="showCompanyInformation(company)">{{ company.id }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showCompanyInformation(company)">{{ company.name }}</td>
                        </tr>
                    </tbody>
                </table>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteDialog">
                    <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <span class="flex flex-col items-center">
                            Do you want to delete the company with id 
                            <span>
                                <b>{{ companyIdToDelete }} </b> ?
                            </span>
                        </span>
                        <div class="flex gap-4">
                            <a @click="deleteDialog.close(); error_message='';" class="btn-pb-b">Cancel</a>
                            <a @click="deleteCompany()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="companyDialog">
                    <form @submit.prevent="updateCompany();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                            <table class="text-left">
                                <tbody>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">ID</th>
                                        <td class="py-1 px-2">{{ companyDetailed.id }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Name</th>
                                        <td class="py-1 px-2">
                                            <input id="name" class="input-pb w-full" v-model="updatedName" required></input>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Created At</th>
                                        <td class="py-1 px-2">{{ new Date(companyDetailed.createdAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                    <tr class="">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Updated At</th>
                                        <td class="py-1 px-2">{{ new Date(companyDetailed.updatedAt).toLocaleString("tr-TR") }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <a @click="showBranchesOfDetailedCompany()" class="w-full btn-uto-a text-center">Branches</a>
                        <div class="flex gap-4">
                            <button type="submit" class="btn-j-b">Save</button>
                            <a @click="companyDialog.close(); error_message='';" class="btn-pb-b">Close</a>
                        </div>
                    </form>
                </dialog>
                <dialog  class="m-auto py-[1vh] px-[2vw] rounded-md" ref="branchesDialog">
                    <div class="flex flex-col gap-4 items-center">
                        <div class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                            <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                            <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                                <thead>
                                    <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                                        <th class="px-2 py-1">ID</th>
                                        <th class="px-2 py-1">Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="branch in branchesOfDetailedCompany" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                                        <td class="px-2 py-1">{{ branch.id }}</td>
                                        <td class="px-2 py-1">{{ branch.name }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <a @click="branchesDialog.close(); error_message='';" class="btn-pb-b w-fit">Close</a>
                    </div>
                </dialog>
            </div>
            <div v-else>
                {{ companies.error }}
            </div>
        </div>
    </div>
</template>