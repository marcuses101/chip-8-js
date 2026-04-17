# VA - x coordinate of sprite
# VB - y coordinate of sprite
# VC - text offset
# V8, V9 - math stuff

    LD I, slides
    CALL presentation
    CALL spinLoop

nextSlide:
    LD VF, K
    CLS
    LD VA, 0
    LD VB, 0
    JP increment
putSpace:
    ADD VA, 5
    CALL checkNewLine
    JP increment
putNewLine:
    CALL newLine
    JP increment

presentation:
    # get the value at the address
    LD V0, [I]
    SNE V0, 0xFF # treating as string terminator
    RET
    # If we hit a "next slide" clear screen and go to increment
    SNE V0, 038
    JP nextSlide
    SNE V0, 37
    JP putSpace
    SNE V0, 036
    JP putNewLine

drawChar:
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
increment:
    ADD VC, 1
    LD I, slides
    ADD I, VC
    JP presentation
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
    # J
    DB 0b11110000
    DB 0b00100000
    DB 0b00100000
    DB 0b10100000
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
    DB 012 # 'C'
    DB 017 # 'H'
    DB 018 # 'I'
    DB 025 # 'P'
    DB 037 # ' '
    DB 008 # '8'
    DB 036 # '\n'
    DB 014 # 'E'
    DB 022 # 'M'
    DB 030 # 'U'
    DB 021 # 'L'
    DB 010 # 'A'
    DB 029 # 'T'
    DB 024 # 'O'
    DB 027 # 'R'
    DB 038 # 'next slide'
    DB 032 # 'W'
    DB 017 # 'H'
    DB 034 # 'Y'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 017 # 'H'
    DB 018 # 'I'
    DB 028 # 'S'
    DB 029 # 'T'
    DB 024 # 'O'
    DB 027 # 'R'
    DB 034 # 'Y'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 031 # 'V'
    DB 022 # 'M'
    DB 037 # ' '
    DB 028 # 'S'
    DB 025 # 'P'
    DB 014 # 'E'
    DB 012 # 'C'
    DB 028 # 'S'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 027 # 'R'
    DB 014 # 'E'
    DB 028 # 'S'
    DB 014 # 'E'
    DB 010 # 'A'
    DB 027 # 'R'
    DB 012 # 'C'
    DB 017 # 'H'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 013 # 'D'
    DB 014 # 'E'
    DB 031 # 'V'
    DB 014 # 'E'
    DB 021 # 'L'
    DB 024 # 'O'
    DB 025 # 'P'
    DB 022 # 'M'
    DB 014 # 'E'
    DB 023 # 'N'
    DB 029 # 'T'
    DB 038 # 'next slide'
    DB 028 # 'S'
    DB 029 # 'T'
    DB 027 # 'R'
    DB 008 # '8'
    DB 037 # ' '
    DB 019 # 'J'
    DB 028 # 'S'
    DB 036 # '\n'
    DB 023 # 'N'
    DB 024 # 'O'
    DB 037 # ' '
    DB 013 # 'D'
    DB 014 # 'E'
    DB 025 # 'P'
    DB 028 # 'S'
    DB 036 # '\n'
    DB 023 # 'N'
    DB 024 # 'O'
    DB 037 # ' '
    DB 011 # 'B'
    DB 030 # 'U'
    DB 018 # 'I'
    DB 021 # 'L'
    DB 013 # 'D'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 031 # 'V'
    DB 022 # 'M'
    DB 036 # '\n'
    DB 014 # 'E'
    DB 022 # 'M'
    DB 030 # 'U'
    DB 021 # 'L'
    DB 010 # 'A'
    DB 029 # 'T'
    DB 018 # 'I'
    DB 024 # 'O'
    DB 023 # 'N'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 032 # 'W'
    DB 014 # 'E'
    DB 011 # 'B'
    DB 037 # ' '
    DB 010 # 'A'
    DB 025 # 'P'
    DB 025 # 'P'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 020 # 'K'
    DB 014 # 'E'
    DB 034 # 'Y'
    DB 036 # '\n'
    DB 029 # 'T'
    DB 010 # 'A'
    DB 020 # 'K'
    DB 014 # 'E'
    DB 010 # 'A'
    DB 032 # 'W'
    DB 010 # 'A'
    DB 034 # 'Y'
    DB 028 # 'S'
    DB 036 # '\n'
    DB 038 # 'next slide'
    DB 022 # 'M'
    DB 024 # 'O'
    DB 027 # 'R'
    DB 014 # 'E'
    DB 037 # ' '
    DB 013 # 'D'
    DB 014 # 'E'
    DB 022 # 'M'
    DB 024 # 'O'
    DB 028 # 'S'
    DB 0xFF # terminator

