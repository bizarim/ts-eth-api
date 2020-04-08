export interface ExpressRequestEx extends Express.Request {
    startAt: [number, number];
}

export interface ExpressResponseEx extends Express.Response {
    endAt: [number, number];
}