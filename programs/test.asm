LD V0, 5
LD V9, 5
LD V5, 1

CALL loopDraw


LD V1, K # pause execution

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



  
