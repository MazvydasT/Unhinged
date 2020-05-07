export class Vector2 {
    public readonly x: number;
    public readonly y: number;

    constructor(x?: any, y?: any) {
        //debugger;

        this.x = x === undefined ? 0 : x === null || isNaN(Number(x)) ? null : Number(x);
        this.y = y === undefined ? 0 : y === null || isNaN(Number(y)) ? null : Number(y);
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    add(vector: Vector2) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector: Vector2) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }
}

export class Vector3 extends Vector2 {
    public readonly z: number;

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    subtract(vector: Vector3) {
        return new Vector3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }

    constructor(x?: any, y?: any, z?: any) {
        super(x, y);

        this.z = z === undefined ? 0 : z === null || isNaN(Number(z)) ? null : Number(z);
    }
}