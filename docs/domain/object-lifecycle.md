# Object Lifecycle

## Wspolny cykl zycia obiektu

1. `Draft` - obiekt zostal utworzony lub zmieniony w przestrzeni roboczej.
2. `Validated` - przeszedl walidacje techniczna i biznesowa.
3. `Rejected` - walidacja wykryla bledy blokujace publikacje.
4. `Published` - stan zostal zatwierdzony i przeniesiony do warstwy referencyjnej.
5. `Archived` - obiekt nie jest aktywny operacyjnie, ale pozostaje w historii.

## Uwagi

- obiekt moze wielokrotnie wracac z `Rejected` do `Draft`,
- publikacja powinna tworzyc pelny slad audytowy,
- usuniecie logiczne jest preferowane nad fizycznym kasowaniem danych referencyjnych.
