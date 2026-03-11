import axios from 'axios';
import { Equipment } from '../types';

const API_URL = '/api/equipment';

export const getAllEquipment = async (): Promise<Equipment[]> => {
    const response = await axios.get<Equipment[]>(API_URL);
    return response.data;
};

export const getEquipmentById = async (id: string): Promise<Equipment> => {
    const response = await axios.get<Equipment>(`${API_URL}/${id}`);
    return response.data;
};

export const createEquipment = async (equipment: Equipment): Promise<Equipment> => {
    const response = await axios.post<Equipment>(API_URL, equipment);
    return response.data;
};

export const updateEquipment = async (id: string, equipment: Equipment): Promise<Equipment> => {
    const response = await axios.put<Equipment>(`${API_URL}/${id}`, equipment);
    return response.data;
};

export const deleteEquipment = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};