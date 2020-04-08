import 'reflect-metadata';
import { IsNotEmpty, IsString } from 'class-validator';

export class WithdrawDto {
    @IsString()
    @IsNotEmpty()
    readonly uuid: string;
    @IsString()
    @IsNotEmpty()
    readonly token: string;
}