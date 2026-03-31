# Context Diagram

```mermaid
flowchart LR
  User[Operator GIS / Analityk / Administrator]
  Platform[Road GIS Platform]
  Auth[System tozsamosci]
  Files[Magazyn plikow]
  Ext[Zewnetrzne zrodla danych]
  Consumers[Systemy raportowe i mapowe]

  User --> Platform
  Platform --> Auth
  Platform --> Files
  Ext --> Platform
  Platform --> Consumers
```

## Komentarz

Platforma jest centralnym systemem roboczym. Uzytkownicy pracuja w jednej aplikacji, natomiast system integruje tozsamosc, zalaczniki, importy oraz publikacje danych do konsumentow zewnetrznych.
