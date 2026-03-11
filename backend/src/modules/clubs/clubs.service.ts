import { Injectable } from '@nestjs/common';
import { Club } from './clubs.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubsRepository } from './clubs.repository';

@Injectable()
export class ClubsService {
  constructor(private readonly clubsRepository: ClubsRepository) {}

  async create(createClubDto: CreateClubDto): Promise<Club> {
    const club = this.clubsRepository.create(createClubDto);
    return await this.clubsRepository.save(club);
  }

  async findAll(): Promise<Club[]> {
    return await this.clubsRepository.find();
  }

  async findOne(id: number): Promise<Club> {
    return await this.clubsRepository.findOne(id);
  }

  async update(id: number, updateClubDto: UpdateClubDto): Promise<Club> {
    await this.clubsRepository.update(id, updateClubDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.clubsRepository.delete(id);
  }
}