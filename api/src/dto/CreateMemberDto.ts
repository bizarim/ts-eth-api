import 'reflect-metadata';
import { MinLength, MaxLength } from 'class-validator';

export class CreateMemberDto {
    @MinLength(1, {
        message: 'uuid is too short'
    })
    @MaxLength(64, {
        message: 'uuid is too long'
    })
    readonly uuid: string;
}