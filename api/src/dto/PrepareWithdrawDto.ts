import 'reflect-metadata';
import { IsNotEmpty, IsString } from 'class-validator';

export class PrepareWithdrawDto {
    @IsString()
    @IsNotEmpty()
    readonly uuid: string;
    @IsString()
    @IsNotEmpty()
    readonly to: string;
    @IsString()
    @IsNotEmpty()
    readonly amount: string;
    @IsString()
    @IsNotEmpty()
    readonly unit: string;
}