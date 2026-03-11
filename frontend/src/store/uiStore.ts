import { makeAutoObservable } from 'mobx';

class UIStore {
    isLoading = false;
    isModalOpen = false;

    constructor() {
        makeAutoObservable(this);
    }

    setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    openModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }
}

const uiStore = new UIStore();
export default uiStore;