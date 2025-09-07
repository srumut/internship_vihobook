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
    const products = ref(null);

    fetch("/api/products", {
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
        products.value = {ok: true, data: data};
    }).catch((err) => {
        products.value = {ok: false, error: err};
    })

    const deleteDialog = ref();
    const productIdToDelete = ref();

    function showDeleteModal(id) {
        productIdToDelete.value = id;
        deleteDialog.value.showModal();
    }

    function deleteProduct() {
        fetch(`/api/products/${productIdToDelete.value}`, {
            method: "DELETE",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`
            }
        }).then((res) => {
            if (res.ok) {
                for (let i = 0; i < products.value.data.length; i++) {
                    if (products.value.data[i].id === productIdToDelete.value) {
                        products.value.data.splice(i, 1);
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

    const productDialog = ref();
    const productDetailed = ref({id: ""});

    const updatedName = ref("");
    const updatedStock = ref(0);
    const updatedCategoryId = ref("");
    const updatedBranchId = ref("");

    const error_message = ref("");

    function showProductInformation(product) {
        error_message.value = "";
        updatedName.value = product.name;
        updatedStock.value = product.stock;
        updatedCategoryId.value = product.category_id;
        updatedBranchId.value = product.branch_id;
        productDetailed.value = product;
        productDialog.value.showModal();
    }

    function updateProduct() {
        error_message.value = "";
        fetch(`/api/products/${productDetailed.value.id}`, {
            method: "PATCH",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": updatedName.value,
                "stock": updatedStock.value,
                "category_id": updatedCategoryId.value,
                "branch_id": updatedBranchId.value
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
            for (let i = 0; i < products.value.data.length; i++) {
                if (products.value.data[i].id === data.id) {
                    products.value.data[i] = data;
                    break;
                }
            }
            productDialog.value.close();
            error_message.value = "";
        }).catch((err) => {
            console.error(err);
        })
    }
    
    const addProductDialog = ref();

    function showAddProductDialog() {
        addProductDialog.value.showModal();
    }

    const addProductId = ref();
    const addProductName = ref();
    const addProductStock = ref();
    const addProductCategoryId = ref();
    const addProductBranchId = ref();

    function addProduct() {
        fetch("/api/products", {
            method: "POST",
            headers: {
                "authorization": `Bearer ${cookies["authorization"]}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "id": addProductId.value,
                "name": addProductName.value,
                "stock": addProductStock.value,
                "category_id": addProductCategoryId.value,
                "branch_id": addProductBranchId.value,
            })
        }).then(async (res) => {
            if (res.ok) {
                return res.json();
            } else if (res.status === 401) {
                alert("It seems your session has been expired, please login again!");
                logout();
            }
            const data = await res.json();
            if (res.status === 400 || res.status === 404) {
                error_message.value = data.message;
            }
            throw Error(data.message);
        }).then((data) => {
            products.value.data.push(data);
            addProductId.value = "";
            addProductName.value = "";
            addProductStock.value = "";
            addProductCategoryId.value = "";
            addProductBranchId.value = "";
            addProductDialog.value.close();
            error_message.value = "";
        }).catch((err) => {
            console.error(err);
        })
    }
</script> 

<template>
  <div class="flex-grow w-full flex flex-col gap-4">
        <!--add product navbar-->
        <div class="w-full flex justify-end">
            <!-- TODO(umut): integrate search capability
            <form class="flex gap-[1vw]">
                <input class="input-pb w-min-100 w-[20vw]"></input>
                <a class="btn-pb-b">Search</a>
            </form>
            -->
            <a @click="showAddProductDialog();" class="btn-j-b">Add New Product</a>
            <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="addProductDialog">
                <form @submit.prevent="addProduct();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                    <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                    <input class="input-pb" type="text" placeholder="ID" v-model="addProductId" required/>
                    <input class="input-pb" type="text" placeholder="Name" v-model="addProductName" required/>
                    <input class="input-pb" type="number" min="0" placeholder="Stock" v-model="addProductStock" required/>
                    <input class="input-pb" type="text" placeholder="Branch ID" v-model="addProductBranchId" required/>
                    <input class="input-pb" type="text" placeholder="Category ID" v-model="addProductCategoryId" required/>
                    <div class="flex gap-4">
                        <button type="submit" class="btn-j-b">Create</button>
                        <a @click="addProductDialog.close(); error_message = '';" class="btn-pb-b">Close</a> 
                    </div>
                </form>
            </dialog>
        </div>
        <!-- Products -->
        <div class="flex-grow w-full overflow-y-scroll h-full">
            <div v-if="products === null">Loading...</div> 
            <div v-else-if="products.ok" class="rounded-md border border-[var(--color-prussianblue)] overflow-hidden">
                <table class="box-border text-[var(--color-prussianblue)] table-auto w-full">
                    <thead>
                        <tr class="bg-[var(--color-prussianblue)] text-left text-white">
                            <th></th>
                            <th class="px-2 py-1">ID</th>
                            <th class="px-2 py-1">Name</th>
                            <th class="px-2 py-1">Stock</th>
                            <th class="px-2 py-1">Category</th>
                            <th class="px-2 py-1">Branch</th>
                            <th class="px-2 py-1">Company</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="product in products.data" class="not-last:border-b-1 h-fit hover:bg-[var(--color-prussianblue)]/15">
                            <td class="flex justify-center">
                                <a @click="showDeleteModal(product.id);">
                                    <DeleteIcon class="w-8 h-8 hover:fill-[var(--color-cerise)] hover:cursor-pointer"></DeleteIcon>
                                </a>
                            </td>
                            <td class="px-2 py-1 hover:cursor-pointer border-l-1 border-[var(--color-prussianblue)]" @click="showProductInformation(product)">{{ product.id }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showProductInformation(product)">{{ product.name }}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showProductInformation(product)">{{ product.stock}}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showProductInformation(product)">{{ product.category}}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showProductInformation(product)">{{ product.branch}}</td>
                            <td class="px-2 py-1 hover:cursor-pointer" @click="showProductInformation(product)">{{ product.company}}</td>
                        </tr>
                    </tbody>
                </table>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="deleteDialog">
                    <div class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)]">
                        <span class="flex flex-col items-center">
                            Do you want to delete the product with id 
                            <span>
                                <b>{{ productIdToDelete }} </b> ?
                            </span>
                        </span>
                        <div class="flex gap-4">
                            <a @click="deleteDialog.close(); error_message = '';" class="btn-pb-b">Cancel</a>
                            <a @click="deleteProduct()" class="btn-c-b">Delete</a>
                        </div>
                    </div>
                </dialog>
                <dialog class="m-auto py-[1vh] px-[2vw] rounded-md" ref="productDialog">
                    <form @submit.prevent="updateProduct();" class="flex flex-col items-center gap-4 box-border text-[var(--color-prussianblue)] ">
                        <div class="text-[var(--color-cerise)]">{{ error_message }}</div>
                        <div class="box-border border border-[var(--color-prussianblue)] rounded-md overflow-hidden">
                            <table class="text-left">
                                <tbody>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">ID</th>
                                        <td class="py-1 px-2">{{ productDetailed.id }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Name</th>
                                        <td class="py-1 px-2">
                                            <input type="text" class="input-pb w-full" v-model="updatedName" required/>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Stock</th>
                                        <td class="py-1 px-2">
                                            <input type="number" class="input-pb w-full" v-model="updatedStock" required/>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Category</th>
                                        <td class="py-1 px-2">{{ productDetailed.category }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Category Description</th>
                                        <td class="py-1 px-2">{{ productDetailed.category_description }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Category ID</th>
                                        <td class="py-1 px-2">
                                            <input type="text" class="input-pb w-full" v-model="updatedCategoryId" required/>
                                        </td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Company</th>
                                        <td class="py-1 px-2">{{ productDetailed.company }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Company ID</th>
                                        <td class="py-1 px-2">{{ productDetailed.company_id }}</td>
                                    </tr>
                                    <tr class="border-b border-[var(--color-prussianblue)]">
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Branch</th>
                                        <td class="py-1 px-2">{{ productDetailed.branch }}</td>
                                    </tr>
                                    <tr>
                                        <th class="bg-[var(--color-prussianblue)] text-white py-1 px-2">Branch ID</th>
                                        <td class="py-1 px-2">
                                            <input type="text" class="input-pb w-full" v-model="updatedBranchId" required/>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="flex gap-4">
                            <button type="submit" class="btn-j-b">Save</button>
                            <a @click="productDialog.close(); error_message = '';" class="btn-pb-b">Close</a>
                        </div>
                    </form>
                </dialog>
            </div>
            <div v-else>
                {{ products.error }}
            </div>
        </div>
    </div>
</template>