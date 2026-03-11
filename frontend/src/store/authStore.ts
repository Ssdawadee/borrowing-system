import { makeAutoObservable } from 'mobx';

class AuthStore {
    user = null;
    isAuthenticated = false;

    constructor() {
        makeAutoObservable(this);
    }

    setUser(user) {
        this.user = user;
        this.isAuthenticated = !!user;
    }

    logout() {
        this.user = null;
        this.isAuthenticated = false;
    }

    get isAdmin() {
        return this.user?.role === 'admin';
    }
}

export const authStore = new AuthStore();