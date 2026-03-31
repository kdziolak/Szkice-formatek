# Reference System Rules

## Zasady podstawowe

- podstawowym ukladem roboczym dla danych przestrzennych jest krajowy uklad zgodny z wymaganiami instytucji zamawiajacej,
- wszystkie geometrie zapisywane w bazie musza miec jednoznaczny SRID,
- frontend i GeoServer musza jawnie deklarowac transformacje warstw, zamiast polegac na domyslnych ustawieniach.

## Zasady operacyjne

1. Import danych bez SRID jest odrzucany lub wymaga jawnego mapowania przez operatora.
2. Publikacja warstw mapowych musi wskazywac docelowy uklad renderingu i zrodlo geometrii.
3. Eksport do systemow zewnetrznych moze wymuszac transformacje do innych ukladow, ale zrodlem referencyjnym pozostaje uklad roboczy systemu.
4. Walidacja topologii jest wykonywana po normalizacji geometrii do jednego ukladu.
