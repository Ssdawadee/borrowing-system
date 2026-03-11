import { Injectable } from '@nestjs/common';
import { Equipment } from './equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentRepository } from './equipment.repository';

@Injectable()
export class EquipmentService {
  constructor(private readonly equipmentRepository: EquipmentRepository) {}

  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    const equipment = this.equipmentRepository.create(createEquipmentDto);
    return await this.equipmentRepository.save(equipment);
  }

  async findAll(): Promise<Equipment[]> {
    return await this.equipmentRepository.find();
  }

  async findOne(id: number): Promise<Equipment> {
    return await this.equipmentRepository.findOne(id);
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto): Promise<Equipment> {
    await this.equipmentRepository.update(id, updateEquipmentDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.equipmentRepository.delete(id);
  }
}