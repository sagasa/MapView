//2Dベクトル計算

import { inverse, Matrix } from "ml-matrix";

export type Vec2 = {
    x: number;
    y: number;
};

export type Pos3 = {
    p0: Vec2;
    p1: Vec2;
    p2: Vec2;
};

//console.log(calcAffine({p0:{x:0,y:0},p1:{x:600,y:0},p2:{x:0,y:400}},{p0:{x:200,y:100},p1:{x:719.6152,y:400},p2:{x:0,y:446.4102}}))

//const test = new DOMMatrix()
//test.scaleSelf(2,2)
//console.log(test)

export function zero() {
    return { x: 0, y: 0 };
}

export function inf() {
    return { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };
}

export function infNega() {
    return { x: -Number.MAX_SAFE_INTEGER, y: -Number.MAX_SAFE_INTEGER };
}

export function calcAffine(pos0: Pos3, pos1: Pos3) {
    const mat = new Matrix([
        [pos0.p0.x, pos0.p0.y, 1, 0, 0, 0],
        [0, 0, 0, pos0.p0.x, pos0.p0.y, 1],
        [pos0.p1.x, pos0.p1.y, 1, 0, 0, 0],
        [0, 0, 0, pos0.p1.x, pos0.p1.y, 1],
        [pos0.p2.x, pos0.p2.y, 1, 0, 0, 0],
        [0, 0, 0, pos0.p2.x, pos0.p2.y, 1],
    ]);
    const inversed = inverse(mat);
    const dst = Matrix.columnVector([
        pos1.p0.x,
        pos1.p0.y,
        pos1.p1.x,
        pos1.p1.y,
        pos1.p2.x,
        pos1.p2.y,
    ]);
    const ans = inversed.mmul(dst);
    return new DOMMatrix([
        ans.get(0, 0),
        ans.get(3, 0),
        ans.get(1, 0),
        ans.get(4, 0),
        ans.get(2, 0),
        ans.get(5, 0),
    ]);
}

//線分abとcの距離
export function calcDistSegmentPoint(a: Vec2, b: Vec2, c: Vec2) {
    if (dot3(a, b, c) <= 0) {
        return dist(b, c);
    } else if (dot3(b, a, c) <= 0) {
        return dist(a, c);
    }
    const ab = sub(a, b);
    const ac = sub(a, c);
    return Math.abs(cross(ac, ab) / length(ab));
}

//連続する線分と点の最短距離
export function calcDistLinePoint(line: Vec2[], p: Vec2) {
    if(line.length==1){
        return dist(p, line[0])
    }
    return line.reduce((prev, p0, i) => {
        if (i == 0) return prev;
        const p1 = line[(line.length + i - 1) % line.length];
        return Math.min(prev, calcDistSegmentPoint(p0, p1, p));
    }, Number.MAX_SAFE_INTEGER);
}

export function isOnline(a: Vec2, b: Vec2, c: Vec2) {
    return 0 < dot3(a, b, c) && 0 < dot3(b, a, c);
}

export function colSegment(start0: Vec2, end0: Vec2, start1: Vec2, end1: Vec2) {
    const v0 = sub(end0, start0);
    const v1 = sub(end1, start1);

    const v = sub(start1, start0);
    const Crs_v1_v2 = cross(v0, v1);
    if (Crs_v1_v2 == 0.0) {
        // 平行状態
        return false;
    }

    const Crs_v_v1 = cross(v, v0);
    const Crs_v_v2 = cross(v, v1);

    const t1 = Crs_v_v2 / Crs_v1_v2;
    const t2 = Crs_v_v1 / Crs_v1_v2;

    const eps = 0.00001;
    if (t1 + eps < 0 || t1 - eps > 1 || t2 + eps < 0 || t2 - eps > 1) {
        // 交差していない
        return false;
    }

    //if( outPos )
    //   *outPos = start0 + v0 * t1;
    return true;
}

export function sub(p1: Vec2, p2: Vec2) {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function add(p1: Vec2, p2: Vec2) {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function mul(p1: Vec2, scale: number) {
    return { x: p1.x * scale, y: p1.y * scale };
}

export function div(p1: Vec2, scale: number) {
    return { x: p1.x / scale, y: p1.y / scale };
}

export function dot3(a: Vec2, b: Vec2, c: Vec2) {
    const ax = a.x - b.x;
    const bx = c.x - b.x;
    const ay = a.y - b.y;
    const by = c.y - b.y;
    return ax * bx + ay * by;
}

export function dot(a: Vec2, b: Vec2) {
    return a.x * b.x + a.y * b.y;
}

export function cross3(a: Vec2, b: Vec2, c: Vec2) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

export function cross(a: Vec2, b: Vec2) {
    return a.x * b.y - a.y * b.x;
}

//dest無しならvを改変
export function norm(v: Vec2, dest: Vec2 | undefined = undefined) {
    const l = Math.sqrt(v.x * v.x + v.y * v.y);
    if (dest == undefined) {
        v.x /= l;
        v.y /= l;
        return v;
    }
    dest.x = v.x / l;
    dest.y = v.y / l;
    return dest;
}

export function dist(a: Vec2, b: Vec2) {
    return length(sub(a, b));
}

export function length(a: Vec2) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
}

export function avg(...vec: Vec2[]) {
    let x = 0,
        y = 0;
    vec.forEach((v) => {
        x += v.x;
        y += v.y;
    });
    return { x: x / vec.length, y: y / vec.length };
}

export function rote90(a: Vec2) {
    return { x: a.y, y: -a.x };
}

export function max(a: Vec2, b: Vec2, dest: Vec2 | undefined = undefined) {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    if (dest == undefined) {
        return { x: x, y: y };
    }
    dest.x = x;
    dest.y = y;
    return dest;
}

export function min(a: Vec2, b: Vec2, dest: Vec2 | undefined = undefined) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    if (dest == undefined) {
        return { x: x, y: y };
    }
    dest.x = x;
    dest.y = y;
    return dest;
}

export function contain(min: Vec2, vec: Vec2, max: Vec2,margin:number=0) {
    return min.x-margin <= vec.x && vec.x <= max.x+margin && min.y-margin <= vec.y && vec.y <= max.y+margin;
}
