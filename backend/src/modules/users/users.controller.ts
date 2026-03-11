import { Request, Response } from 'express';
import { UserService } from './users.service';
import { User } from '../../types/index';

class UsersController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public async getAllUsers(req: Request, res: Response): Promise<Response> {
        try {
            const users: User[] = await this.userService.getAllUsers();
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving users', error });
        }
    }

    public async getUserById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        try {
            const user: User | null = await this.userService.getUserById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving user', error });
        }
    }

    public async createUser(req: Request, res: Response): Promise<Response> {
        const newUser: User = req.body;
        try {
            const createdUser: User = await this.userService.createUser(newUser);
            return res.status(201).json(createdUser);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating user', error });
        }
    }

    public async updateUser(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const updatedUser: User = req.body;
        try {
            const user: User | null = await this.userService.updateUser(id, updatedUser);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Error updating user', error });
        }
    }

    public async deleteUser(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        try {
            const deletedUser: User | null = await this.userService.deleteUser(id);
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting user', error });
        }
    }
}

export const usersController = new UsersController();