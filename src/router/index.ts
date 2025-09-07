import { createRouter, createWebHistory } from "vue-router";

import IndexView from "@/views/IndexView.vue";
import AuthView from "@/views/AuthView.vue";
import UserRegisterView from "@/views/UserRegisterView.vue";
import UserLoginView from "@/views/UserLoginView.vue";
import AdminLoginView from "@/views/AdminLoginView.vue";
import UserProductsView from "@/views/UserProductsView.vue";
import AdminDashboardView from "@/views/AdminDashboardView.vue";
import UserProductView from "@/views/UserProductView.vue";
import UserOrdersView from "@/views/UserOrdersView.vue";

const routes = [
    { path: "/", component: IndexView },
    { path: "/auth", component: AuthView },
    { path: "/register", component: UserRegisterView },
    { path: "/user/login", component: UserLoginView },
    { path: "/admin/login", component: AdminLoginView },
    { path: "/products", component: UserProductsView },
    { path: "/admin/dashboard", component: AdminDashboardView },
    { path: "/products/:product_id", component: UserProductView },
    { path: "/orders", component: UserOrdersView },
];
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
});

export default router;
