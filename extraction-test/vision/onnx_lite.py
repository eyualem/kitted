"""A minimal ONNX reader (protobuf wire format, no onnx package): nodes, initializers, inputs, outputs. Enough for
YuNet's graph (T96 face-model test, Nov 15)."""
import struct

import numpy as np


def _varint(b, i):
    r = s = 0
    while True:
        c = b[i]
        i += 1
        r |= (c & 0x7F) << s
        s += 7
        if c < 0x80:
            return r, i


def fields(b):
    """[(field number, wire type, value)] of one message; length-delimited values stay bytes."""
    i, out = 0, []
    while i < len(b):
        k, i = _varint(b, i)
        f, t = k >> 3, k & 7
        if t == 0:
            v, i = _varint(b, i)
        elif t == 1:
            v = b[i:i + 8]
            i += 8
        elif t == 2:
            n, i = _varint(b, i)
            v = b[i:i + n]
            i += n
        elif t == 5:
            v = b[i:i + 4]
            i += 4
        else:
            raise ValueError(f"wire type {t}")
        out.append((f, t, v))
    return out


DT = {1: np.float32, 6: np.int32, 7: np.int64, 9: np.bool_, 10: np.float16, 11: np.float64}


def tensor(b):
    dims, dt, name, raw, fl, il = [], 1, "", None, [], []
    for f, t, v in fields(b):
        if f == 1:
            if t == 2:
                j = 0
                while j < len(v):
                    x, j = _varint(v, j)
                    dims.append(x)
            else:
                dims.append(v)
        elif f == 2:
            dt = v
        elif f == 8:
            name = v.decode()
        elif f == 9:
            raw = v
        elif f == 4:
            fl += list(struct.unpack(f"<{len(v) // 4}f", v)) if t == 2 else [struct.unpack("<f", v)[0]]
        elif f == 7:
            if t == 2:
                j = 0
                while j < len(v):
                    x, j = _varint(v, j)
                    il.append(x if x < 1 << 63 else x - (1 << 64))
            else:
                il.append(v)
    if raw is not None:
        a = np.frombuffer(raw, dtype=DT[dt]).copy()
    elif fl:
        a = np.array(fl, np.float32)
    else:
        a = np.array(il, DT.get(dt, np.int64))
    return name, a.reshape(dims) if dims else a.reshape(())


def attribute(b):
    name, val, ints, floats = "", None, [], []
    for f, t, v in fields(b):
        if f == 1:
            name = v.decode()
        elif f == 2:
            val = struct.unpack("<f", v)[0]
        elif f == 3:
            val = v if v < 1 << 63 else v - (1 << 64)
        elif f == 4:
            val = v.decode(errors="replace")
        elif f == 5:
            val = tensor(v)[1]
        elif f == 7:
            floats += list(struct.unpack(f"<{len(v) // 4}f", v)) if t == 2 else [struct.unpack("<f", v)[0]]
        elif f == 8:
            if t == 2:
                j = 0
                while j < len(v):
                    x, j = _varint(v, j)
                    ints.append(x if x < 1 << 63 else x - (1 << 64))
            else:
                ints.append(v if v < 1 << 63 else v - (1 << 64))
    if ints:
        val = ints
    elif floats:
        val = floats
    return name, val


def value_info(b):
    name, shape = "", []
    for f, t, v in fields(b):
        if f == 1:
            name = v.decode()
        elif f == 2:  # TypeProto -> tensor_type(1) -> shape(2) -> dim(1) -> dim_value(1) | dim_param(2)
            for f2, _, v2 in fields(v):
                if f2 == 1:
                    for f3, _, v3 in fields(v2):
                        if f3 == 2:
                            for f4, _, v4 in fields(v3):
                                if f4 == 1:
                                    d = None
                                    for f5, _, v5 in fields(v4):
                                        d = v5 if f5 == 1 else (v5.decode() if f5 == 2 else d)
                                    shape.append(d)
    return name, shape


def load(path):
    b = open(path, "rb").read()
    graph = next(v for f, _, v in fields(b) if f == 7)
    nodes, inits, inputs, outputs = [], {}, [], []
    for f, _, v in fields(graph):
        if f == 1:
            n = {"in": [], "out": [], "op": "", "name": "", "attr": {}}
            for f2, _, v2 in fields(v):
                if f2 == 1:
                    n["in"].append(v2.decode())
                elif f2 == 2:
                    n["out"].append(v2.decode())
                elif f2 == 3:
                    n["name"] = v2.decode()
                elif f2 == 4:
                    n["op"] = v2.decode()
                elif f2 == 5:
                    k, val = attribute(v2)
                    n["attr"][k] = val
            nodes.append(n)
        elif f == 5:
            k, a = tensor(v)
            inits[k] = a
        elif f == 11:
            inputs.append(value_info(v))
        elif f == 12:
            outputs.append(value_info(v))
    return {"nodes": nodes, "inits": inits, "inputs": [i for i in inputs if i[0] not in inits], "outputs": outputs}
