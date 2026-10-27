"""Gera os ícones da extensão: quadrado vermelho arredondado, play branco e um risco de "proibido"."""
import math
import struct
import sys
import zlib

VERMELHO = (220, 38, 38)
BRANCO = (255, 255, 255)
ESCURO = (30, 30, 30)


def dentro_retangulo_arredondado(x, y, raio):
    # coordenadas em 0..1
    cx = min(max(x, raio), 1 - raio)
    cy = min(max(y, raio), 1 - raio)
    return (x - cx) ** 2 + (y - cy) ** 2 <= raio ** 2


def dentro_triangulo(x, y):
    # play apontando pra direita
    a, b, c = (0.36, 0.27), (0.36, 0.73), (0.74, 0.50)

    def lado(p, q, r):
        return (r[0] - q[0]) * (p[1] - q[1]) - (r[1] - q[1]) * (p[0] - q[0])

    d1, d2, d3 = lado((x, y), a, b), lado((x, y), b, c), lado((x, y), c, a)
    neg = d1 < 0 or d2 < 0 or d3 < 0
    pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (neg and pos)


def distancia_risco(x, y):
    # risco diagonal do canto superior esquerdo ao inferior direito
    p, q = (0.2, 0.2), (0.8, 0.8)
    dx, dy = q[0] - p[0], q[1] - p[1]
    t = max(0, min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - (p[0] + t * dx), y - (p[1] + t * dy))


def cor_no_ponto(x, y, tam):
    if not dentro_retangulo_arredondado(x, y, 0.22):
        return None
    d = distancia_risco(x, y)
    # risco mais grosso nos ícones pequenos pra não sumir
    meia = 0.045 if tam >= 48 else 0.05
    vao = 0.05 if tam >= 48 else 0.045
    if d <= meia:
        return BRANCO
    if d <= meia + vao:
        return VERMELHO
    if dentro_triangulo(x, y):
        return BRANCO
    return VERMELHO


def gerar(tam):
    amostras = 4
    linhas = []
    for py in range(tam):
        linha = bytearray([0])
        for px in range(tam):
            r = g = b = a = 0
            for sy in range(amostras):
                for sx in range(amostras):
                    x = (px + (sx + 0.5) / amostras) / tam
                    y = (py + (sy + 0.5) / amostras) / tam
                    cor = cor_no_ponto(x, y, tam)
                    if cor:
                        r += cor[0]; g += cor[1]; b += cor[2]; a += 1
            n = amostras * amostras
            if a:
                linha += bytes([r // a, g // a, b // a, round(255 * a / n)])
            else:
                linha += bytes([0, 0, 0, 0])
        linhas.append(bytes(linha))
    return png(tam, b"".join(linhas))


def png(tam, dados):
    def bloco(tipo, conteudo):
        return struct.pack(">I", len(conteudo)) + tipo + conteudo + struct.pack(">I", zlib.crc32(tipo + conteudo))

    ihdr = struct.pack(">IIBBBBB", tam, tam, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", ihdr) + bloco(b"IDAT", zlib.compress(dados, 9)) + bloco(b"IEND", b"")


if __name__ == "__main__":
    destino = sys.argv[1]
    for tam in (16, 32, 48, 128):
        with open(f"{destino}/icon-{tam}.png", "wb") as f:
            f.write(gerar(tam))
        print(f"icon-{tam}.png")
