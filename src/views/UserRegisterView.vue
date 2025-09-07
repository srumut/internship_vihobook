<script setup>
    import { ref } from 'vue';
    import { navigateToDashboardIfLoggedIn } from '@/assets/script/utility';

    const success = ref();
    const error = ref();

    const name = ref();
    const surname = ref();
    const username = ref();
    const password = ref();

    navigateToDashboardIfLoggedIn(document.cookie);

    const submitForm = () => {
        fetch("/api/users", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: name.value,
                surname: surname.value,
                username: username.value,
                password: password.value
            }),
        })
        .then(async (res) => {
            const body = await res.json();
            if (res.ok) {
                success.value = "User created successfully."
            }
            else {
                error.value = body.message;
            }
            throw new Error(body.message);
        })
        .catch(async (err) => {
            console.error(err);
            error.value = err;
        })
    }
</script>

<template>
    <div class="h-dvh flex items-center justify-center">
        <div class="m-4 w-full sm:w-10/12 md:w-8/12 lg:w-6/12 xl:w-4/12">
            <div class="w-full mb-4">
                <div v-if="success" class="w-full rounded-md text-center py-2 bg-(--color-jade)/30 text-(--color-jade)"> {{ success }}</div>
                <div v-else-if="error" class="w-full rounded-md text-center py-2 bg-(--color-cerise)/30 text-(--color-cerise)"> {{ error }}</div>
            </div>
            <form @submit.prevent="submitForm"  class="grid grid-cols-[27%_70%] gap-4">
                <label for="name" class="text-[var(--color-prussianblue)]">Name</label>
                <input id="name" v-model="name" type="text" autocomplete="name" placeholder="Thomas" class="input-pb" required/>

                <label for="surname" class="text-[var(--color-prussianblue)]">Surname</label>
                <input id="surname" v-model="surname" type="text" autocomplete="family-name" placeholder="Anderson" class="input-pb" required/>

                <label for="username" class="text-[var(--color-prussianblue)]">Username</label>
                <input id="username" v-model="username" type="text" autocomplete="username" placeholder="Neo" class="input-pb" required/>

                <label for="password" class="text-[var(--color-prussianblue)]">Password</label>
                <input id="password" v-model="password" type="password" autocomplete="new-password" placeholder="password" class="input-pb" required/>

                <button type="submit" class="col-span-2 btn-j-b">Register</button>
            </form>
        </div>
    </div>
</template>