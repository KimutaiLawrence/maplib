const EPSILON = 0.000001

export class Matrices {
  static perspective(
    fov: number,
    aspect: number,
    near: number,
    far: number,
    out: Float32Array
  ): Float32Array {
    const f = 1.0 / Math.tan(fov / 2)
    const nf = 1 / (near - far)

    out[0] = f / aspect
    out[1] = 0
    out[2] = 0
    out[3] = 0

    out[4] = 0
    out[5] = f
    out[6] = 0
    out[7] = 0

    out[8] = 0
    out[9] = 0
    out[10] = (far + near) * nf
    out[11] = -1

    out[12] = 0
    out[13] = 0
    out[14] = (2 * far * near) * nf
    out[15] = 0

    return out
  }

  static ortho(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
    out: Float32Array
  ): Float32Array {
    const rl = 1 / (right - left)
    const tb = 1 / (top - bottom)
    const fn = 1 / (near - far)

    out[0] = 2 * rl
    out[1] = 0
    out[2] = 0
    out[3] = 0

    out[4] = 0
    out[5] = 2 * tb
    out[6] = 0
    out[7] = 0

    out[8] = 0
    out[9] = 0
    out[10] = 2 * fn
    out[11] = 0

    out[12] = -(right + left) * rl
    out[13] = -(top + bottom) * tb
    out[14] = (far + near) * fn
    out[15] = 1

    return out
  }

  static translate(out: Float32Array, a: Float32Array, v: [number, number, number]): Float32Array {
    const x = v[0]
    const y = v[1]
    const z = v[2]

    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    out[3] = a[3]

    out[4] = a[4]
    out[5] = a[5]
    out[6] = a[6]
    out[7] = a[7]

    out[8] = a[8]
    out[9] = a[9]
    out[10] = a[10]
    out[11] = a[11]

    out[12] = a[12] + x
    out[13] = a[13] + y
    out[14] = a[14] + z
    out[15] = a[15]

    return out
  }

  static scale(out: Float32Array, a: Float32Array, v: [number, number, number]): Float32Array {
    const x = v[0]
    const y = v[1]
    const z = v[2]

    out[0] = a[0] * x
    out[1] = a[1] * x
    out[2] = a[2] * x
    out[3] = a[3] * x

    out[4] = a[4] * y
    out[5] = a[5] * y
    out[6] = a[6] * y
    out[7] = a[7] * y

    out[8] = a[8] * z
    out[9] = a[9] * z
    out[10] = a[10] * z
    out[11] = a[11] * z

    out[12] = a[12]
    out[13] = a[13]
    out[14] = a[14]
    out[15] = a[15]

    return out
  }

  static rotateZ(out: Float32Array, a: Float32Array, rad: number): Float32Array {
    const s = Math.sin(rad)
    const c = Math.cos(rad)

    const a00 = a[0]
    const a01 = a[1]
    const a02 = a[2]
    const a03 = a[3]

    const a20 = a[8]
    const a21 = a[9]
    const a22 = a[10]
    const a23 = a[11]

    out[0] = a00 * c + a20 * s
    out[1] = a01 * c + a21 * s
    out[2] = a02 * c + a22 * s
    out[3] = a03 * c + a23 * s

    out[8] = a20 * c - a00 * s
    out[9] = a21 * c - a01 * s
    out[10] = a22 * c - a02 * s
    out[11] = a23 * c - a03 * s

    out[4] = a[4]
    out[5] = a[5]
    out[6] = a[6]
    out[7] = a[7]

    out[12] = a[12]
    out[13] = a[13]
    out[14] = a[14]
    out[15] = a[15]

    return out
  }

  static multiply(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array {
    const a00 = a[0]
    const a01 = a[1]
    const a02 = a[2]
    const a03 = a[3]
    const a10 = a[4]
    const a11 = a[5]
    const a12 = a[6]
    const a13 = a[7]
    const a20 = a[8]
    const a21 = a[9]
    const a22 = a[10]
    const a23 = a[11]
    const a30 = a[12]
    const a31 = a[13]
    const a32 = a[14]
    const a33 = a[15]

    let b0 = b[0]
    let b1 = b[1]
    let b2 = b[2]
    let b3 = b[3]

    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

    b0 = b[4]
    b1 = b[5]
    b2 = b[6]
    b3 = b[7]

    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

    b0 = b[8]
    b1 = b[9]
    b2 = b[10]
    b3 = b[11]

    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

    b0 = b[12]
    b1 = b[13]
    b2 = b[14]
    b3 = b[15]

    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

    return out
  }

  static identity(out: Float32Array): Float32Array {
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = 0
    out[5] = 1
    out[6] = 0
    out[7] = 0
    out[8] = 0
    out[9] = 0
    out[10] = 1
    out[11] = 0
    out[12] = 0
    out[13] = 0
    out[14] = 0
    out[15] = 1
    return out
  }
}