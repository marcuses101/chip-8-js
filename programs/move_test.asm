LD V0, 5
LD V7, 10 
LD V9, 10 
LD V5, 1

LD ST, V9

LD I, happy
DRW V1, V1, 6

LD V2, 0xF
CALL loopDraw


LD V5, K # pause execution
LD ST, V7
LD V6, K # pause execution
LD ST, V7
LD V7, K # pause execution
LD ST, V7
LD V8, K # pause execution
LD ST, V7

spinLoop:
    JP spinLoop

loopDraw:
    RND V8, 0xF
    SPR V8
    SUB V9, V5 
    CALL drawSprite
    SE V9, 0
    JP loopDraw
    RET

drawSprite:
    DRW V1, V2, 5
    ADD V1, 5
    RET


happy:
    DB 0b01100110
    DB 0b00100010
    DB 0b00001000
    DB 0b00010000
    DB 0b10000001
    DB 0b01111110


  
