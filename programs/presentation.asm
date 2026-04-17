# VA - x coordinate of sprite
# VB - y coordinate of sprite
# VC - text offset
# V8, V9 - math stuff

CALL main

main: 
    LD I, text
    CALL printString
    CALL spinLoop

printString:
    # get the value at the address
    LD V0, [I]
    SNE V0, 0xFF # treating as string terminator
    RET
    # map to the sprite
    # first check if in normal sprite range
    LD V8, V0  
    LD V9, 0x10
    SUB V8, V9
    SE VF, 0 
    JP fancyDraw
    SPR V0
    JP drawEnd
fancyDraw:
    LD V9, 0x10
    SUB V0, V9
    LD I, alphabet

    LD V9, 1
    LD V8, 6

seekChar:
    SNE V0, 0
    JP drawEnd
    SUB V0, V9
    ADD I, V8
    JP seekChar
drawEnd:
    CALL putChar
    ADD VC, 1
    LD I, text
    ADD I, VC
    JP printString
    RET

spinLoop:
    JP spinLoop

newLine:
    LD  VA, 0
    ADD VB, 6
    RET

checkNewLine:
    LD V8, VA
    LD V9, 64 
    SUB V8, V9
    SE VF, 0
    CALL newLine
    RET


putChar:
    DRW VA, VB, 5
    ADD VA, 5
    # if at the end of line, move to the next line
    CALL checkNewLine
    RET

alphabet:
    # G
    DB 0b11110000
    DB 0b10000000
    DB 0b10110000
    DB 0b10010000
    DB 0b11110000
    DB 0b00000000
    # H
    DB 0b10010000
    DB 0b10010000
    DB 0b11110000
    DB 0b10010000
    DB 0b10010000
    DB 0b00000000
    # I
    DB 0b11100000
    DB 0b01000000
    DB 0b01000000
    DB 0b01000000
    DB 0b11100000
    DB 0b00000000
    # K
    DB 0b10010000
    DB 0b10100000
    DB 0b11000000
    DB 0b10100000
    DB 0b10010000
    DB 0b00000000
    # L
    DB 0b10000000
    DB 0b10000000
    DB 0b10000000
    DB 0b10000000
    DB 0b11110000
    DB 0b00000000
    # M
    DB 0b10010000
    DB 0b11110000
    DB 0b10010000
    DB 0b10010000
    DB 0b10010000
    DB 0b00000000
    # N
    DB 0b10010000
    DB 0b11010000
    DB 0b10110000
    DB 0b10010000
    DB 0b10010000
    DB 0b00000000
    # O
    DB 0b01100000
    DB 0b10010000
    DB 0b10010000
    DB 0b10010000
    DB 0b01100000
    DB 0b00000000
    # P
    DB 0b11110000
    DB 0b10010000
    DB 0b11110000
    DB 0b10000000
    DB 0b10000000
    DB 0b00000000
    # Q
    DB 0b01100000
    DB 0b10010000
    DB 0b10010000
    DB 0b10100000
    DB 0b01010000
    DB 0b00000000
    # R
    DB 0b11110000
    DB 0b10010000
    DB 0b11110000
    DB 0b10100000
    DB 0b10010000
    DB 0b00000000
    # S
    DB 0b11110000
    DB 0b10000000
    DB 0b11110000
    DB 0b00010000
    DB 0b11110000
    DB 0b00000000
    # T
    DB 0b11100000
    DB 0b01000000
    DB 0b01000000
    DB 0b01000000
    DB 0b01000000
    DB 0b00000000
    # U
    DB 0b10010000
    DB 0b10010000
    DB 0b10010000
    DB 0b10010000
    DB 0b11110000
    DB 0b00000000
    # V
    DB 0b10100000
    DB 0b10100000
    DB 0b10100000
    DB 0b10100000
    DB 0b01000000
    DB 0b00000000
    # W
    DB 0b10010000
    DB 0b10010000
    DB 0b10010000
    DB 0b11110000
    DB 0b10010000
    DB 0b00000000
    # X
    DB 0b10010000
    DB 0b10010000
    DB 0b01100000
    DB 0b10010000
    DB 0b10010000
    DB 0b00000000
    # Y
    DB 0b10100000
    DB 0b10100000
    DB 0b01000000
    DB 0b01000000
    DB 0b01000000
    DB 0b00000000
    # Z
    DB 0b11110000
    DB 0b00010000
    DB 0b01100000
    DB 0b10000000
    DB 0b11110000
    DB 0b00000000

slides: