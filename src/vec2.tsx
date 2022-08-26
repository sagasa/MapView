//2Dベクトル計算

type Vec2 = {
  x: number;
  y: number;
};

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
export function norm(v: Vec2, dest: Vec2) {
  const l = Math.sqrt(v.x * v.x + v.y * v.y);
  if (dest == null) {
    v.x /= l;
    v.y /= l;
    return v;
  }
  dest.x = v.x / l;
  dest.y = v.y / l;
  return dest;
}
