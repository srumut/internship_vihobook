<script setup>
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { navigateToDashboardIfLoggedIn, parseJwtPayload } from '@/assets/script/utility';

    const error = ref();
    const username = ref();
    const password = ref();
    const router = useRouter();

    navigateToDashboardIfLoggedIn(document.cookie);

    const submitForm = () => {
        fetch("/api/admin/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: username.value,
                password: password.value
            }),
        })
        .then(async (res) => {
            const body = await res.json();
            if (!res.ok) {
                error.value = body.message;
                return;
            }
            const jwt = parseJwtPayload(body["access_token"]);
            const exp = new Date(parseInt(jwt.exp) * 1000);
            document.cookie = `authorization=${body["access_token"]}; expires=${exp.toUTCString()}; path=/`;
            document.cookie = `account=admin; expires=${exp.toGMTString()}; path=/`;
            router.push("/admin/dashboard");
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
                <div v-if="error" class="w-full rounded-md text-center py-2 bg-(--color-cerise)/30 text-(--color-cerise)"> {{ error }}</div>
            </div>
            <form @submit.prevent="submitForm"  class="grid grid-cols-[27%_70%] gap-4">
                <label for="username" class="text-[var(--color-prussianblue)]">Username</label>
                <input id="username" v-model="username" type="text" autocomplete="username" class="input-pb" required/>

                <label for="password" class="text-[var(--color-prussianblue)]">Password</label>
                <input id="password" v-model="password" type="password" autocomplete="current-password" class="input-pb" required/>

                <button type="submit" class="col-span-2 btn-pb-b">Login</button>
            </form>
        </div>
    </div>
</template>