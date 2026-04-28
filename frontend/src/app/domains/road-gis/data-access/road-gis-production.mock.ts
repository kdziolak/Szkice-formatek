import {
  ExportJob,
  ImportReport,
  ImportSession,
  LayerDefinition,
  MapComposition,
  ParcelComparisonResult,
  ReportDefinition,
  WorkflowDefinition
} from '../models/road-gis-domain.models';

export const ROAD_GIS_LAYER_DEFINITIONS: LayerDefinition[] = [
  layer('osm', 'OpenStreetMap', 'OpenStreetMap', 'RASTER', true, false, '#d7ead1', 'OSM'),
  layer('gugik-ortho', 'Geoportal / GUGiK', 'Geoportal / GUGiK', 'RASTER', false, false, '#bdd7ee', 'GUGIK'),
  layer('parcels', 'Działki ewidencyjne', 'Działki ewidencyjne', 'POLYGON', true, false, '#a78bfa', 'GEOSERVER'),
  layer('classification', 'Kontury klasyfikacyjne', 'Kontury klasyfikacyjne', 'POLYGON', false, false, '#f8c471', 'GEOSERVER'),
  layer('reference-system', 'System Referencyjny', 'System Referencyjny', 'LINESTRING', true, false, '#2563eb', 'GEOSERVER'),
  layer('zid-objects', 'Obiekty ZID', 'Obiekty ZID', 'MIXED', true, true, '#16a34a', 'GEOSERVER'),
  layer('traffic-stations', 'Stacje pomiaru ruchu', 'Obiekty ZID', 'POINT', true, true, '#7c3aed', 'GEOSERVER'),
  layer('road-barriers', 'Bariery', 'Obiekty ZID', 'LINESTRING', true, true, '#ef4444', 'GEOSERVER'),
  layer('road-signs', 'Znaki', 'Obiekty ZID', 'POINT', true, true, '#f59e0b', 'GEOSERVER'),
  layer('noise-screens', 'Ekrany akustyczne', 'Obiekty ZID', 'LINESTRING', false, true, '#0f766e', 'GEOSERVER'),
  layer('draft-objects', 'Obiekty w wersji roboczej', 'Obiekty w wersji roboczej', 'MIXED', true, true, '#f97316', 'LOCAL'),
  layer('auxiliary', 'Warstwy pomocnicze', 'Warstwy pomocnicze', 'MIXED', false, false, '#64748b', 'LOCAL')
];

export const ROAD_GIS_MAP_COMPOSITION: MapComposition = {
  id: 'technical-operational-map',
  name: 'Mapa techniczno-eksploatacyjna ZID',
  epsg: 'EPSG:3857 / PUWG 1992',
  scaleLabel: '1 : 25 000',
  center: [21.0122, 52.2301],
  layers: ROAD_GIS_LAYER_DEFINITIONS
};

export const ROAD_GIS_WORKFLOWS: WorkflowDefinition[] = [
  workflow('map-composition', 'Kompozycja mapowa', 'Mapa + warstwy + tabela', 'Odśwież kompozycję', [
    ['layers', 'Warstwy', 'Operator włącza warstwy i wybiera aktywną warstwę.', 'done', '12 warstw'],
    ['select', 'Identyfikacja', 'Kliknięcie obiektu synchronizuje mapę, tabelę i panel.', 'active', '1 zaznaczenie'],
    ['attributes', 'Atrybuty', 'Panel pokazuje status rekordu, walidacji i dowiązanie SR.', 'pending']
  ]),
  workflow('infrastructure-import', 'Import obiektów infrastruktury', 'SHP, GML/XML, GeoJSON, DXF, DWG, CSV, XLSX', 'Importuj do wersji roboczej', [
    ['file', 'Wybór pliku', 'Plik importu został wskazany i ma rozpoznany format.', 'done', 'GeoJSON'],
    ['layers', 'Rozpoznanie warstw', 'System pokazuje warstwy, geometrie i liczbę rekordów.', 'done', '3 warstwy'],
    ['geometry', 'Mapowanie geometrii', 'Warstwy punktowe, liniowe i powierzchniowe trafiaja do typów ZID.', 'active'],
    ['attributes', 'Mapowanie atrybutów', 'Pola z pliku sa mapowane na kontrakt domenowy.', 'pending'],
    ['preview', 'Podgląd na mapie', 'Import jest widoczny jako warstwa robocza.', 'pending'],
    ['validation', 'Walidacja', 'System wykrywa CRS, braki pól i konflikty przestrzenne.', 'pending'],
    ['report', 'Raport końcowy', 'Wynik importu trafia do raportu i workspace.', 'pending']
  ]),
  workflow('parcel-import', 'Import działek', 'SAP HANA vs ZID vs Geoportal / GUGiK', 'Zatwierdź decyzje', [
    ['file', 'Dane z pliku', 'Kandydaci z SAP HANA są gotowi do porównania.', 'done', '248 pozycji'],
    ['zid', 'Dane ZID', 'System wykrył działki obecne w bazie ZID.', 'done', '231 pozycji'],
    ['gugik', 'Dane GUGiK', 'Warstwa referencyjna jest podłączona do porównania.', 'active'],
    ['diff', 'Porównanie różnic', 'Lista rozbieżności wymaga decyzji operatora.', 'pending', '17 różnic'],
    ['report', 'Raport importu', 'Raport pokazuje dodane, zaktualizowane, zarchiwizowane i odrzucone działki.', 'pending']
  ]),
  workflow('workset', 'Wersja robocza', 'Tryb zarządzania danymi', 'Przygotuj do zatwierdzenia', [
    ['scope', 'Wybierz obszar lub warstwę', 'Operator ogranicza zakres pracy.', 'done'],
    ['add', 'Dodaj obiekty', 'Obiekty trafiają do aktywnej wersji roboczej.', 'active'],
    ['edit', 'Edytuj atrybuty', 'Zmiany dostają status roboczy.', 'pending'],
    ['validate', 'Waliduj dane', 'Walidacja wskazuje błędy blokujące i ostrzeżenia.', 'pending'],
    ['summary', 'Podsumowanie zmian', 'System pokazuje obiekty gotowe do finalnego zapisu.', 'pending']
  ]),
  workflow('object-editor', 'Edycja atrybutów obiektu', 'Zakładki domenowe ZID', 'Zapisz wersję roboczą', [
    ['basic', 'Dane podstawowe', 'Kod, nazwa, status, właściciel i jednostka.', 'active'],
    ['details', 'Dane szczegółowe', 'Atrybuty zalezne od typu obiektu.', 'pending'],
    ['reference', 'Lokalizacja i SR', 'Kilometraż i dowiązanie do odcinka referencyjnego.', 'pending'],
    ['technical', 'Dane techniczne', 'Parametry techniczne infrastruktury drogowej.', 'pending'],
    ['validation', 'Walidacja', 'Problemy pól i geometrii przy formularzu.', 'pending'],
    ['attachments', 'Załączniki / źródła', 'Pliki źródłowe i metadane importu.', 'pending']
  ]),
  workflow('reference-binding', 'Dowiązywanie do SR', 'Obiekt -> odcinek referencyjny', 'Zatwierdź dowiązanie', [
    ['object', 'Wybierz obiekt', 'Obiekt z mapy lub tabeli jest aktywny.', 'done'],
    ['nearby', 'Pobliskie odcinki', 'System pokazuje alternatywne odcinki SR.', 'active', '3 propozycje'],
    ['mileage', 'Kilometraż', 'Wyliczany jest kilometraz lokalny i globalny.', 'pending'],
    ['confirm', 'Zatwierdzenie', 'Obiekt dostaje status Dowiązany do SR.', 'pending']
  ]),
  workflow('validation', 'Centralna walidacja danych', 'Atrybuty, geometria, SR, CRS, uprawnienia', 'Otwórz problem', [
    ['attributes', 'Błędy atrybutowe', 'Braki wymaganych pól i niezgodności typów.', 'active', '4'],
    ['geometry', 'Błędy geometrii', 'Samoprzecięcia, puste geometrie, CRS.', 'pending', '2'],
    ['reference', 'Brak dowiązania SR', 'Obiekty bez powiązania z odcinkiem referencyjnym.', 'pending', '5'],
    ['conflict', 'Konflikty przestrzenne', 'Nakładanie z innymi obiektami albo obszarem uprawnień.', 'pending', '1']
  ]),
  workflow('reports-export', 'Raporty i eksport', 'Raporty terenu, walidacji, importu i eksport warstw', 'Generuj raport', [
    ['scope', 'Zakres raportu', 'Warstwa, zaznaczenie albo zakres mapy.', 'active'],
    ['definition', 'Definicja raportu', 'Operator wybiera raport predefiniowany.', 'pending'],
    ['format', 'Format wyjścia', 'XLSX, CSV, PDF, GeoJSON, SHP, GML/XML, DXF.', 'pending'],
    ['job', 'Zadanie eksportu', 'Zlecenie trafia do kolejki eksportu.', 'pending']
  ])
];

export const ROAD_GIS_IMPORT_SESSION: ImportSession = {
  id: 'import-objects-001',
  sourceName: 'obiekty_zid_dk7.geojson',
  format: 'GeoJSON',
  status: 'MAPOWANIE',
  layers: [
    {id: 'barriers', name: 'bariery_dk7', geometryType: 'LINESTRING', featureCount: 84, selected: true, targetType: 'ROAD_BARRIER'},
    {id: 'stations', name: 'stacje_pomiaru', geometryType: 'POINT', featureCount: 12, selected: true, targetType: 'TRAFFIC_COUNTING_STATION'},
    {id: 'screens', name: 'ekrany_akustyczne', geometryType: 'LINESTRING', featureCount: 9, selected: false, targetType: 'NOISE_SCREEN'}
  ],
  mappings: [
    {sourceField: 'kod', targetField: 'objectCode', required: true, confidence: 0.98},
    {sourceField: 'droga', targetField: 'roadNumber', required: true, confidence: 0.96},
    {sourceField: 'km_od', targetField: 'globalMileageFrom', required: true, confidence: 0.91},
    {sourceField: 'material', targetField: 'attributes.material', required: false, confidence: 0.84}
  ]
};

export const ROAD_GIS_PARCEL_COMPARISON: ParcelComparisonResult = {
  id: 'parcel-compare-001',
  importSource: 'SAP HANA / plik działek 2026-04',
  discrepancyCount: 17,
  candidates: [
    {id: 'p-1', parcelNumber: '146501_8.0012.15/4', commune: 'Warszawa', source: 'SAP_HANA', status: 'DODANA', reason: 'Nowa działka w pliku importu.'},
    {id: 'p-2', parcelNumber: '146501_8.0012.18/2', commune: 'Warszawa', source: 'GUGIK', status: 'ZAKTUALIZOWANA', reason: 'Różnica powierzchni względem GUGiK.'},
    {id: 'p-3', parcelNumber: '146501_8.0012.21/1', commune: 'Warszawa', source: 'ZID', status: 'ZARCHIWIZOWANA', reason: 'Obecna w ZID, brak w pliku importu.'},
    {id: 'p-4', parcelNumber: '146501_8.0012.24/7', commune: 'Warszawa', source: 'SAP_HANA', status: 'WYMAGA_DECYZJI', reason: 'Konflikt granicy z danymi GUGiK.'}
  ]
};

export const ROAD_GIS_IMPORT_REPORT: ImportReport = {
  id: 'report-import-parcels-001',
  title: 'Raport po imporcie działek - DK7 Warszawa',
  added: 22,
  updated: 41,
  archived: 8,
  rejected: 3,
  discrepancies: [
    '17 rozbieżności między plikiem SAP HANA a GUGiK.',
    '8 działek obecnych w ZID nie występuje w pliku importu.',
    '3 rekordy odrzucone z powodu braku identyfikatora TERYT.'
  ]
};

export const ROAD_GIS_REPORT_DEFINITIONS: ReportDefinition[] = [
  {id: 'terrain', name: 'Raport o terenie', category: 'TEREN', formats: ['PDF', 'XLSX']},
  {id: 'predefined', name: 'Raporty predefiniowane', category: 'PREDEFINIOWANY', formats: ['XLSX', 'CSV', 'PDF']},
  {id: 'validation', name: 'Raport walidacji', category: 'WALIDACJA', formats: ['XLSX', 'PDF']},
  {id: 'import', name: 'Raport importu', category: 'IMPORT', formats: ['XLSX', 'PDF']},
  {id: 'layers', name: 'Eksport warstw', category: 'EKSPORT', formats: ['GeoJSON', 'SHP', 'GML/XML', 'DXF']}
];

export const ROAD_GIS_EXPORT_JOBS: ExportJob[] = [
  {id: 'export-1', name: 'Eksport zaznaczonych barier DK7', scope: 'ZAZNACZENIE', format: 'SHP', status: 'GOTOWY'},
  {id: 'export-2', name: 'Eksport zakresu mapy - działki', scope: 'ZAKRES_MAPY', format: 'GML/XML', status: 'W_TRAKCIE'}
];

function layer(
  id: string,
  name: string,
  group: string,
  geometryType: LayerDefinition['geometryType'],
  visible: boolean,
  editable: boolean,
  color: string,
  sourceKind: LayerDefinition['sourceKind']
): LayerDefinition {
  return {
    id,
    name,
    group,
    geometryType,
    visible,
    active: visible,
    editable,
    opacity: visible ? 0.85 : 0.55,
    minScaleLabel: geometryType === 'RASTER' ? '0-500k' : '0-50k',
    sourceKind,
    legendItems: [{label: name, color, symbol: geometryType === 'POINT' ? 'point' : geometryType === 'POLYGON' ? 'polygon' : geometryType === 'RASTER' ? 'raster' : 'line'}]
  };
}

function workflow(
  kind: WorkflowDefinition['kind'],
  title: string,
  contextLabel: string,
  primaryAction: string,
  steps: Array<[string, string, string, WorkflowDefinition['steps'][number]['status'], string?]>
): WorkflowDefinition {
  return {
    kind,
    title,
    contextLabel,
    primaryAction,
    steps: steps.map(([id, stepTitle, description, status, metric]) => ({id, title: stepTitle, description, status, metric}))
  };
}
