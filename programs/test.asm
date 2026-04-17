LD V0, 0xF
SPR V0
DRW V0, V0, 5

spinLoop:
    JP spinLoop
test:
    JP test