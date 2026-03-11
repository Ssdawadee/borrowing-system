import { Request, Response } from 'express';
import { ClubService } from './clubs.service';

class ClubsController {
    private clubService: ClubService;

    constructor() {
        this.clubService = new ClubService();
    }

    public async getAllClubs(req: Request, res: Response): Promise<void> {
        try {
            const clubs = await this.clubService.getAllClubs();
            res.status(200).json(clubs);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving clubs', error });
        }
    }

    public async getClubById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const club = await this.clubService.getClubById(id);
            if (club) {
                res.status(200).json(club);
            } else {
                res.status(404).json({ message: 'Club not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving club', error });
        }
    }

    public async createClub(req: Request, res: Response): Promise<void> {
        const clubData = req.body;
        try {
            const newClub = await this.clubService.createClub(clubData);
            res.status(201).json(newClub);
        } catch (error) {
            res.status(500).json({ message: 'Error creating club', error });
        }
    }

    public async updateClub(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const clubData = req.body;
        try {
            const updatedClub = await this.clubService.updateClub(id, clubData);
            if (updatedClub) {
                res.status(200).json(updatedClub);
            } else {
                res.status(404).json({ message: 'Club not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error updating club', error });
        }
    }

    public async deleteClub(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const deleted = await this.clubService.deleteClub(id);
            if (deleted) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Club not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error deleting club', error });
        }
    }
}

export const clubsController = new ClubsController();