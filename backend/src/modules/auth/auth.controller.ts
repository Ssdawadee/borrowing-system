import { Request, Response } from 'express';
import { AuthService } from './auth.service';

class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public async register(req: Request, res: Response): Promise<Response> {
        try {
            const userData = req.body;
            const newUser = await this.authService.register(userData);
            return res.status(201).json(newUser);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    public async login(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;
            const token = await this.authService.login(email, password);
            return res.status(200).json({ token });
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }
    }

    public async logout(req: Request, res: Response): Promise<Response> {
        try {
            await this.authService.logout(req.user.id);
            return res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new AuthController();