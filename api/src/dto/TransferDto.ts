import 'reflect-metadata';
import { MinLength, MaxLength, IsString, IsNotEmpty } from 'class-validator';

export class TransferDto {
    @MinLength(1, {
        message: 'uuid is too short'
    })
    @MaxLength(64, {
        message: 'uuid is too long'
    })
    @IsString()
    @IsNotEmpty()
    readonly uuid: string;
}