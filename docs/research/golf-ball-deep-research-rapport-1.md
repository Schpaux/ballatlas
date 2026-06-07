# Eksekutiv sammendrag

Vi foreslår en grundig databasetaxonomi og -struktur for golfkuler, basert på autoritative kilder. Nøkkelkomponenter inkluderer **Merke**, **Familie** (modellnavn) og **Versjon** (årsmodell) for hver ball, samt tekniske spesifikasjoner (konstruksjon, antall dimpler, kompresjon, kjerne- og dekke-materialer), visuelle identifikatorer (logo, tekst, markeringer, farge), segmentkategorier (for eksempel Tour/Premium, Performance, Distance, Begynner, Verdi/lakeball) og prisdata (nypris, bruktpris). Alle entiteter er koblet via relasjoner: Merke → Modellfamilie → Årsversjon. Databasen bør også inneholde bilder (fremvisning av ballens side, merker, logo osv.) og metadata om kvalitet og kilde.

For identifisering og datainnsamling kreves detaljerte bilder fra flere vinkler, merkelapper for merker (tekst, logo, nummer, linjer, mønstre) og prosessert informasjon om de unike trekk (f.eks. Triple Track-linjer, pilemarkør hos Titleist). Vi vurderer hvor nyttig hver identifikasjonsfaktor er (f.eks. merke- og modellnavn er «Svært høy», mens normalt tall (1–4) er «Lav»).

Markedsverdimodellen tar høyde for opprinnelig utsalgspris (MSRP), detaljhandelspris, bruktpris og verdi for resirkulerte/lakeballer. Viktige verdidriverne er merke (premium vs. budsjett), modell (flaggskip vs. nybegynnerball), utgave/år, stand (stand, renset, mint osv.), og etterspørsel/tilgjengelighet. For eksempel selges en Titleist Pro V1 (ny, 1 dusin) for omkring 600–700 NOK mens nypolerte brukte kan koste ~300 NOK/dusin, og resirkulerte ~250 NOK. Prisvurderingen vil derfor inkludere felt for lav/mid/høy verdi (skala i NOK).

Vi har analysert flere kilder: produsenthjemmesider (f.eks. Titleist, Callaway), trenings- og testportaler (MyGolfSpy), bruktsalgssider (LostGolfBalls, FoundGolfBalls), markedsanalyser og «lakeball»-leverandører (Acegolfballs). Hver kilde er vurdert med pålitelighet, tilgjengelighet (API eller skrabbarriere) og lisenshensyn.

Til slutt foreslår vi en første, prioritert liste med 150–300 kulemodeller basert på vanligste og mest populære kuler i Europa og Nord-Amerika. Typiske kandidater er Titleist Pro V1/V1x/AVX (alle årganger), Callaway Chrome Soft/Chrome Tour, TaylorMade TP5, Bridgestone Tour B (XS, X, RX osv.), Srixon Z-Star/XV, Volvik Chrome Tour, Vice Pro/Drive, Wilson Staff Model, Mizuno RB-serien, Nike (20XI-serien), Snell MTB osv. Vi rangerer disse etter sannsynlig utbredelse. Denne «seed»-databasen er grunnlaget for MVP.

Vi beskriver også risikoer (f.eks. datagap, lisensieringsbegrensninger, GDPR, bildekreditering), med forslag til avbøtende tiltak (bruke åpne data, kundebevissthet om opphavsrett). Til slutt skisseres implementeringsanbefalinger og veikart: initialt bygg grunnleggende API for søk og spesifikasjoner, deretter integrere bildeopplastning og AI-identifisering, samt videre utforskning av verdivurderingsalgoritmer.

# 1. Golfkule-taksonomi

Vi anbefaler en hierarkisk taxonomi for å strukturere golfkuler i databasen:

- **Merke** (Brand) – hovednivå, f.eks. Titleist, Callaway, TaylorMade, Srixon, Bridgestone, Vice, Wilson, Volvik, Pinnacle, Top Flite, Mizuno, Nike osv. (se eksempel merker).
- **Kulefamilie/Modell** (Ball Family) – modellnavn under hvert merke, f.eks. _Pro V1_, _Pro V1x_, _AVX_ (Titleist); _Chrome Soft_, _Chrome Tour_, _SuperSoft_ (Callaway); _TP5_, _Tour Response_ (TaylorMade); _Tour B XS_, _Tour B X_, _e12 Speed_ (Bridgestone); _Z‑Star_, _Q‑Star_, _Soft Feel_ (Srixon); _VIVID_, _Chrome Tour_ (Volvik); _Pro Plus_, _Drive_ (Vice) etc. Disse navnene bør entydig identifisere en serie kuler med lignende egenskaper.
- **Års-/Utgaveversjon** (Ball Version) – spesifikk utgave av familien, vanligvis knyttet til produksjonsår eller oppdatering. For eksempel _Pro V1 2025_, _Pro V1 2023_, _Pro V1 2021_. Versjoner kan ofte identifiseres ved markedsføring/årstall eller små tekniske endringer. I databasen bør hver unike årgang eller generasjon _kunne_ være en egen entitet for å spore tekniske endringer og verdiutvikling over tid (f.eks. _Pro V1 (2022)_ vs _Pro V1 (2021)_). Vi anbefaler derfor å behandle hver årgang/utgave som separat entitet med f.eks. årstall, lanseringsdato, aliaser, og lenker til pressemeldinger/pressebilder.

- **Segmentklassifisering** – Tildele hver kule til markedssegment(er). Vi foreslår følgende kategorier:
  - **Tour/Premium:** Topputoverballs, ofte flerlagshard, urethandekke, for proffer og gode amatører. (Eks. Titleist Pro V1/X, Callaway Chrome Soft/X, Taylormade TP5/TP5x, Bridgestone Tour B-serien, Srixon Z-Star/XV). Disse presterer best i alle områder og har høy pris.
  - **Performance:** High-performance kuler som balanserer avstand og kontroll, ofte 3-4-lags med urethane-dekke (eks. Titleist AVX, Callaway Chrome Tour, Srixon Q-Star Tour, Bridgestone Tour B RX/RXS). Litt rimeligere enn flaggskip, men fortsatt avanserte.
  - **Distance:** To-lags eller lavkompresjonskuler som primært er designet for maksimal lengde ved å minimere bakspin (for eksempel Callaway Warbird, TaylorMade Distance Plus, Titleist Velocity, Pinnacle Rush, Bridgestone e6, Slazenger Raw-distance). Vanlig bruk for nybegynnere/høy-handicap spillere.
  - **Soft Feel:** Kuler med ekstra myk følelse/lav kompresjon, gjerne populær blant spillere med lave svinghastigheter. Ofte navngitt «Soft», «TruFeel» etc (eks. Callaway Supersoft, Titleist TruFeel, Srixon Soft Feel, Wilson Duo, etc.).
  - **Rekreasjons/Verdiball:** Billigere kuler for casual spill og klubbgolf; kan inkludere varemerke-løse eller generiske kuler. (Eksempler: Tour Edge Supreme, Top Flite Gamer, slagvaske-lakeballer).
  - **Farget/Utstyrsballer:** Spesialutgaver (kulører, logos, karaktermønstre), kan kategoriseres under hvert segment men markeres som «Farget» eller «Custom».
  - **Lakeball/Resirkulert:** Brukte (innsamlede) golfkuler som klassifiseres etter stand (f.eks. Grade A «Mint», Grade B etc.). Skiller seg ofte i pris/segment (svært lav verdi) og kan knyttes til markedsdata.

**Begrunnelse:** Denne inndelingen reflekterer både tekniske egenskaper (bygning, dekke, kompresjon) og markedsføring. Produsenter deler ofte inn slik («Tour level», «Distance», «Soft», «Value»). For eksempel beskriver Callaway sine top-modeller som _tour level golf balls_ med flerlags urethan-dekke, mens 2-lags surlyn-kuler gir mer lengde for nybegynnere. Kategorien _Lakeball/Resirkulert_ er viktig pga. den store mengden gjenvunne kuler som selges svært billig.

Hver kule kan tilhøre én eller flere segmenter (tagging) dersom det gir mening (f.eks. en Premium-kule kan også være «Myk følelse»).

# 2. Databasedesign-anbefalinger

Vi foreslår følgende hovedentiteter (tabeller) og felter, med relasjoner illustrert slik: **Merke** → **Familie/Modell** → **Versjon**.

- **Merke (Brand):** Felter: _id_, navn (tekst), land, eier (firma), lanseringsår, logo-URL osv. (Mange baller fra én merke.)
- **Kulefamilie/Modell (BallFamily):** Felter: _id_, _brand_id_ (FK), navn (Pro V1, Chrome Soft osv.), type (f.eks. urethane-surlyn), lag (2-piece, 3-piece, 4-piece), dekke-materiale (Surlyn/Urethane), design-notater. (F.eks. Titleist Pro V1). Hver familie kobles til ett merke.
- **Kuleversjon (BallVersion):** Felter: _id_, _family_id_ (FK), år (eller utgave), lanseringsdato, navn_ekstra (f.eks. «2025»), eventuelle varianter (farger, spesialutg.), serienummer/patentreferanse. Vi anbefaler å lage egne rader for hver årgang (f.eks. Pro V1 2024 vs 2025) siden tekniske endringer kan forekomme.
- **Tekniske spesifikasjoner:** (kan være felter i BallVersion eller egen tabell _Specifications_ med _version_id_). Felter: konstruksjonstype (antall lag, kjerne-typologi), kjerne-materiale (type gummi/blanding), dekke-materiale, antall dimpler, dimple-design/pattern (evt. tekstbeskrivelse), diameter, vekt (i gram, toleranse), kompresjonsrating, spin-egenskaper (høy/medium/lav), anbefalt svinghastighet, banetype etc. Eksempel: BreakfastBalls oppgir for 2025 Pro V1: «Tre-lags, termosett urethane dekke, kjerne med ny høykurvematriell, 388 dimpler, kompresjon ~87». Alle slike tekniske data skal kunne lagres.
- **Segmentklasse**: (kan være en egen tabell «Segment» med verdier som nevnt), og en krysstabell _VersionSegment_ (hvilke segment-tag-er en versjon hører til).
- **Priser og markedsdata:** Egen tabell _Prices_ med historiske/registrer priskilder, felter: _version_id_, land/kurrency, utsalgspris (ny), utsalgsdato, bruktpris (med kvalitetsnivå, som LostGolfBalls-grader), dato for bruktpris, kilde (nettbutikk), antall solgte, lagerstatus. Dette gir en tidsserie. Kan også ha enkeltfelt i Version for «opprinnelig MSRP» og «veiledende pris».
- **Bilder (Images):** Tabell _BallImage_ med _version_id_, bilde-URL (eller filstier), type (side, logo-nærbilde, nummer, tilpasning markering, uttømmende utsnitt), oppløsning, lisens. Dette skal støtte AI-datasettbehov (se punkt 4).
- **Identifikator-faktorer:** (valgfritt) - eller alternativt innebygd i _Images_ eller _BallVersion_. Kan ha felter for registrerte trykk/merker: teksten som står på kula (f.eks. «Titleist», «Pro V1», matchende fonter), antall streker, logo-tekstur, etc. Vi kan i første omgang anta at NLP/gjenkjenning senere håndterer dette, men man kan lage entiteter for merker på ballen.
- **Kildeinfo & Konfidens (metadata):** Hvert felt kan ha referanser til hvor data kom fra. E.g. tabell _Sources_ (id, navn, type, URL, rating) og tabell _VersionDataSource_ (version_id, kilde_id, felt, konfidensnivå (1–10)). På denne måten kan man angi at visse spesifikasjoner har høy/lav pålitelighet basert på kilden (f.eks. produsent vs. tredjepart).

**Relasjoner:**

- 1 merke har _mange_ modeller/familier.
- 1 familie har _mange_ versjoner (år).
- 1 versjon har én til flere tekniske spesifikasjoner (oppdateres med data).
- 1 versjon har _mange_ bilder.
- _Price_-poster knyttet til én versjon.
- _Segment_ kan kobles _mange-til-mange_ med versjon.
- Kilde-tabeller knyttet til versjondata for å spore hvor hvert datapunkt kommer fra.

Diagrammet (ERD) vil se ut som:

```
Brand (1) --- (N) ModelFamily (1) --- (N) BallVersion (1) --- (N) Price
                                                   \
                                                    \- (N) BallImage
                                                    \- (1) Specifications
                                                    \- (N) VersionSegment---(1) Segment
                                                    \- (N) VersionSource---(1) Source
```

_Forklaring:_

- **Brand**, **ModelFamily**, **BallVersion** representerer hierarkiet.
- **BallVersion** linkes til **Specifications** (en-til-en eller en-til-mange, alt etter modell) og **BallImage** (en-til-mange).
- **VersionSegment**: Hjelpetabell som tagger hver versjon med segmentkategorier (flere segmenter mulig).
- **Price**: Tabell med prisobservasjoner.
- **Source** og **VersionSource**: For å lagre hvor hver spesifikasjon/verdi kommer fra, med et konfidensfelt.

Denne strukturen er fleksibel nok til å søke/filtere på alle dimensjoner: etter merke, modell, teknisk spesifikasjon, segment, prisnivå osv. Den tillater også fremtidig utvidelse (f.eks. tilleggsdata som materialegenskaper eller patenter via nye tabeller). Tabellen **BallImage** kan struktureres med kolonner for hva bildet viser (f.eks. «AlignmentMarking», «Number», «Logo») slik at CV-databehandling blir enklere.

# 3. Identifikasjonsrammeverk for golfkuler

For å gjenkjenne en golfkule visuelt og tekstuelt, har vi identifisert alle nyttige kjennetegn og vurdert deres brukbarhet:

- **Synlig tekst (merke/modellnavn)**: Svært høy brukbarhet. De fleste merker (Titleist, Callaway, etc.) og modeller (Pro V1, Chrome Soft) står direkte på kula. Dette er unike kjennetegn hvis synlig.
- **Sidestempeltekst** (ballfamilie, eventuelle slagtegn): Svært høy. F.eks. «Pro V1», «TP5» ofte på siden sammen med merke.
- **Nummer (1–4)**: Lav. Tallene (ofte 1,2,3,4 på høyre side) er ikke unike for modell, bare for å differensiere baller i en pakke.
- **Tallfarge**: Lav/Moderat. Noen utgaver bruker farget tall, men dette er mer estetisk enn identifiserende.
- **Skrifttype/fontstil på tall**: Lav. Fonter kan være litt varierende (f.eks. Nike Ball vs Titleist), men ofte lik- eller enkel. Ikke pålitelig alene.
- **Trekkretning/Retningsmarkør (pil)**: Høy. Enkelte merker bruker piler (f.eks. Titleist har en liten pil ved sidestempelet) for putting-hjelp. Dette er gjenkjennbart symbol, men betyr bare merkespesifikt «riktig side».
- **Linjer/markeringer (alignment aid)**: Svært høy. F.eks. _Triple Track_ (tre parallelle striper) er unikt for Callaways Chrome Soft Triple Track-serie. Titleist kan ha én strekk eller ingen (tradisjonelt én linje bak vinkelretning på pil). Andre merker har sine egne. Dette gir sterk indikasjon på modell/varianter.
- **Logoer/symboler**: Svært høy. Merke-logo (f.eks. Titleist-signatur, Callaway «V» logo, Bridgestone «B» logo) eller egenskapslogo (f.eks. Srixon sin «Z\*»). Disse er svært karakteristiske. Logos på høy kvalitet kan brukes av datamaskin til merke-identifikasjon.
- **Cover-materialets overflate (matte vs. blank)**: Medium. Noen kuler har matt finish (f.eks. Srixon Z-Star tungt matte) vs glanset. Kan indikere generasjon eller type (f.eks. Titleist AVX har ofte matt). Men variasjon innen samme modell kan forekomme (fargede baller).
- **Kulens farge** (hvit, gul, oransje, grønn, rosa, etc.): Høy til svært høy. Farge kan utelukke mange modeller. Andre farger enn hvit er ofte få (Volvik VIVID-kuler osv.). Hvis kula er gul, er det f.eks. neppe en Titleist Pro V1 (selv om Pro V1i i 2016 kom i gulversjon).
- **Dimple-mønster og antall dimpler**: Medium. Antall og form/dimensjon kan være unikt (Titleist Pro V1 har 388 tetra-dimpler, mens Pro V1x har 348; Bridgestone Tour B-serien har typisk 330; Mizuno RB566 har 566 små dimpler). Dimplenes form (hex, varierende diameter etc.) kan også skille. Men dette krever høy bildekvalitet eller nærbilde, og er mer av en sekundær egenskap for CV. Vi vurderer dimple-mønster som **middels** brukbar, ettersom mange moderne kuler har 300–400 dimpler og målinger av nøyaktig mønster er komplekst, men det kan hjelpe som ytterligere faktor (se golf-info-guide tabell).
- **Andre dekormaler eller personifisering:** Medium til lav. Golfkuler kan ha spesialtrykk (f.eks. sportslogoer, bilder, eget trykk). Disse er ofte tilfeldige og ikke standard for en modell, men kan gi informasjon hvis de samsvarer med en spesiell utgave (for eksempel Elite-utgaver med patriotiske merkater).

Oppsummerende nyttegrad for identifiseringsfaktorer:

- **Svært høy:** Merke-/modelltekst, logoer/symboler, spesielle alignment-linjer (Triple Track, etc.), kulens farge.
- **Høy:** Piltast, overflatefinish (matte/gloss).
- **Middels:** Dimple-mønster (antall/form), eventuelle unike dekals, pakningsdetaljer.
- **Lav:** Trykksatt tall (1–4), farge/font på tall.

Disse faktorene bør implementeres i et gjenkjenningsrammeverk: All tekst (OCR), visuell sjekk av logoer (f.eks. bruke CNN-objektdetektor for logomerking), og målinger av dimpler kan automatisk telles/gjenkjennes ved bildeprosessering. Triple Track og lignende er veldig tydelige merker (for eksempel viser Callaway at Triple Track “forbedrer innretting”).

# 4. Computer Vision – dataklargjøring

For fremtidig bildebasert gjenkjenning må vi samle et omfattende treningssett. **Datastruktur for AI-identifikasjon:**

- **Påkrevde bildetyper (per kuleversjon):**
  - _Sidebilde (front view)_ – kulens «side» der modellnavn/merke står i fokus.
  - _Andre side_ – motsatt side av kula (dersom andre detaljer/tekst finnes).
  - _Logo-nærbilde_ – close-up av merkets logo (f.eks. Titleist-script, Callaway-V, Bridgestone B).
  - _Markering nærbilde_ – close-up av alignment linjer, tall eller piler.
  - _Topp eller skrått (for dimpler)_ – for å fange dimpelmønsteret tydelig (f.eks. en vinkel som viser dimplene mønstermessig).
  - _Fargevarianter_ – for modeller som kommer i flere farger må vi ha bilder av hver (hvit, gul, osv.).
  - I tillegg: bilder i spill- eller naturmiljø (men da er kulen liten) kan brukes til et augmenteringsnivå for detektorer, mens rene studiefotoer er best for detaljmerking.

- **Bildefiler og metadatakrav:**
  - Høy oppløsning (>1000px i diameter) for at detaljer (tekst, dimpler) skal være lesbare.
  - Metadata: Hvert bilde skal ha felt merket med _ballid_ (versjon), sett-type (f.eks. «Label» for klasse/ID), eventuelle bounding boxes (om vi vil trene objektdeteksjon for logoer eller tekster), fotograf (for lisens/sporbarhet).
  - Belysning: Jevn nøytral belysning anbefales (ingen kraftige skygger).
  - Bakgrunn: helst ensfarget, for enklest merking. Men også noen varierende bakgrunner kan forbedre robusthet (ev. syntetisk data augmentation).
  - Vinkler: Flere vinkler (rotasjon rundt kula) for hver type bilde for å fange eventuelle variasjoner i utstøpning.

- **Krav til datasettets kvalitet:**
  - _Antall bilder per klasse (versjon):_ For å kunne gjenkjenne mange modeller foreslår vi minst 10–20 varierte bilder per nødvendig visningskategori, gjerne mer. For 200 versjoner, kan dette bli 2000–4000 bilder.
  - _Merking:_ Hvert bilde må ha label = versjons-ID (golfkule-modell). For finstilt merking, tegne bounding boxes rundt logoer, skrifter og stempler slik at disse kan trenes som objekter.
  - _Konfidens:_ Trenerne bør angi om en annotasjon er 100% korrekt. For eksempel kan skygger eller slitasje gjøre tekst vanskelig å tyde. Noen bilder kan lavere konfidens hvis uklare markeringer.
  - _Datasplit:_ Tiltenkt trening/validering/test-splitt, gjerne 70/15/15%.
  - _Videre data:_ For AI-gjenkjenning av nye kulebilder i fremtiden, bør vi også inkludere varianter (cupfarget, slitne bruktkuler, kuler med personlige trykk), men initialt fokus på rene eksemplarer.

- **Fremtidige hensyn:**
  - _Etikett for utmerkelser:_ Hvis vi i fremtiden ønsker å lete etter spesialutgaver (eks. limited editions), bør datafelt indikere dette.
  - _3D-modellering:_ Selv om ikke del av MVP, kan volumdata brukes i fremtidig VR eller AR-app. Dataene kan utvides til 3D-modeller hvis nødvendig.
  - _Lov og personvern:_ Bildene må være våre egne eller under tillatt lisens (Creative Commons eller lignende), spesielt for offentlige demoer. Eget fotografering av kuler er anbefalt for sikkerhets skyld.

**Eksempel fra eksisterende dataset:** Roboflows offentlig _golfBall_-datasett med ~17 000 bilder brukes for deteksjon (finner ball i bilde). Vårt behov er mer finmasket: klasseifisering av ballmerke/modell. Derfor er det viktig å ha rene, omfattende bilder av kulene i klar visning.

# 5. Markedsverdi-rammeverk

Golfkuler mister raskt verdi etter kjøp, men verdien varierer mye med merke og stand. Vårt mål er å estimere verdien (lav/mid/høy i NOK) basert på relevante faktorer: merke, modell, utgivelsesår, stand, etterspørsel osv.

**Viktige faktorer:**

- **Originalpris (MSRP)**: Referanse som utgangspunkt. F.eks. koster en ny Titleist Pro V1 omtrent 600–700 NOK for 1 dusin. Et nytt superpremium-merke som TaylorMade TP5 er i samme ballpark (ca. $54/dusin, ~600 NOK).
- **Detaljhandelspris (ny):** Faktiske tilbudspriser hos forhandlere (kan variere over sesong). Felt for «nåværende utsalgspris» i databasen.
- **Bruktpris**: Avhenger av stand (mint, near mint, god). Data fra bruktkilder: LostGolfBalls.com priser viser for Pro V1: _pristine_ ~$50/dusin, _mint_ ~$40, _refinished_ ~$28. Det gir ca. 50–70% av nypris for pent brukte.
- **Recycled/Lakeball-verdi:** Svært lav. I England koster blandede Pro V1-lakeballer kun £18-34 per dusin (ca. 200–400 NOK). Ifølge Rough Thoughts Guiden: resirkulerte koster typisk $0.50–$2 per ball (~5–20 NOK/stk). For 12 stk er det 60–240 NOK.
- **Samlerverdi:** Begrenset og spesifikk (f.eks. limited edition-baller). Dette kan øke verdi hvis det finnes ettertraktede utgaver, men er vanskelig å modellere uten spesiell database. Kan eventuelt merke enkelte utgaver med høy «collectorscore».
- **Stand/forbruk:** Nivå (A/B/C i bruktmarkedet). Mint condition = liten reduksjon, god stand (rent, få merker) = moderat nedgang, slitt (dypere riper) = kraftig redusert. E.g. _mint_ brukt ball kan ha ~60% av nypris.
- **Etterspørsel/popularitet:** Populære kuler (Pro V1, Chrome Soft, TP5 osv.) selges etterspurt brukt, prissettes høyere enn sjeldnere modeller. Omvendt, lite kjent merke/versjon prises lavt (noen samleballer kan havne likevel).
- **Tilgjengelighet:** Nyversjoner tilgjengelig i butikk presser ofte bruktpris ned på eldre modeller (økt tilbud). Aldrende kuler mister verdi over tid.

**Verdianalyse:**

- **Ny (detailj):** Direkte hentet fra butikker (prisfelt).
- **Lav verdi (NOK):** Typisk 20–50 % av nypris for 2-veis kvalitet (A/B), og kun 5–20 % for B/C. Estimat: _Lav verdi = used, scratched, gjenvunnet._
- **Høy verdi (NOK):** Ny eller mint brukt. Kan være nær nypris (80–90 %). Pro V1-eksempel: ny ~600 NOK, mint brukt ~300 NOK, high ~600.
- **Andre valutaer:** Vi konverterer alt til NOK for konsistens. Nye Pro V1 ~$55 (USD) ~ 600 NOK.

**Rammestruktur:** I datamodellen lagrer vi _nypris_, _estimert bruktpris_ (lav/mid/høy), og variabler for hvert verdielement (se faktorer). En algoritme kan bruke multi-faktor input (merke premium? år 0–1 = +20%, år >5 = −50%, stand etc.) for å gi foreløpige vurderinger i NOK.

# 6. Datakildeanalyse

**Tekniske spesifikasjoner:**

- _Produsenthjemmesider_ (Titleist, Callaway, Srixon, etc.): Ofte markedsføringsinfo, men kan gi grunnleggende specs (antall dimpler, dekke). Eks. Titleist (Pro V1-siden) nevner 388 dimpler, cover type, etc. Formelt er dette primærkilder med høy pålitelighet. Ingen offisiell API; scraping kan være mulig men varierer. (Lisens: ofte copyright, men data kan noteres med kildehenvisning.)
- _Pressemeldinger/Newssider:_ Produsenters nyheter (f.eks. Titleist/Titleist Media Center, Callaway News). Gir gjerne tall (dimples, kompresjon) for nye modeller. Pålitelighet 9/10; ingen API, men HTML kan finnes.
- _Uavhengige tester:_ MyGolfSpy Ball Lab (Part of MyGolfSpy). Inneholder målinger (kompresjon, konsistens, utgaver). Pålitelighet 8/10 (uavhengig, testet). Ikke API; webgrenseflaten brukes. Inneholder tall for mengde/lengde/spinn.
- _Wikipedia:_ Gir historikk (f.eks. Pro V1 introd. 2000) og noe teknisk. Pålitelighet variabel (7/10). Enkel å søke, ingen API men finnes DBPedia/OpenData. Bruk med kritikk.

**Historiske modeller/Utgivelser:**

- _Produsentarkiv og fanfora:_ Eldre artikler (f.eks. BreakfastBalls blog har historie over Pro V1 utgivelser). Pålitelighet 7/10 (uavhengig golfblog).
- _Wikipedia:_ Samler utgivelsesår (f.eks. Titleist Pro V1 og V1x timeline).
- _Offentlige presserom:_ Noen merker legger ut videopresentasjoner (YouTube, men da liten tekstdata).
- _Golfmagasiner/nettsteder:_ Golf Digest, GolfChannel, GolfWRX-forum: kan ha oversikter «Model release history». Moderat pålitelighet; dekker ofte alt fra Titleist til Srixon.

**Produktbilder:**

- _Produsentkataloger/-nettbutikker:_ Høykvalitets offisielle bilder (forutsetter lisens/begrenset bruk, men gode referanser).
- _Spesialforhandlere (Callaway, Titleist)_: kan laste ned produktbilder men ofte med lav oppløsning.
- _E-handelsplattformer:_ Amazon, eBay, Ebay Motors etc.: brukte/nye produkter med brukergenererte bilder (varierende kvalitet). Kan scrapes, men lisenseretting er greit (marked).
- _Wikimedia Commons:_ Få golfkule-bilder i fri bruk, men noen generiske (f.eks. Titleist logo på Wikimedia). Pålitelighet 7/10, datafri (CC).
- _Community-databaser:_ Roboflow (golfball deteksjon): har mange åpen lisensbilder (CC BY 4.0). Vi kan bruke dem for visuell variabilitet, men de er markert for ballobjektdeteksjon, ikke merkeidentifikasjon.

**Markedspriser & bruktpris:**

- _LostGolfBalls.com & FoundGolfBalls.com:_ Amerikanske nettbutikker for brukte kuler. Viser graderte priser for hundrevis av modeller. Pålitelighet 8/10 (industriell aktør med store datasett). Uten offisiell API, men mulig scrapes (data i tabellformat). Kilder: priser for A/B/C kvalitet (som vi kan bruke for «lav/mid/høy»-felt, se Pro V1 eksempel,).
- _AceGolfBalls (UK):_ Britisk bruktballforhandler med online sortiment. Vis prisnivå for ulike merker/stand. Pålitelighet 7/10.
- _Auction-nettsteder (eBay, eBid):_ Variabel datakvalitet, men gir markedsprisindikatorer. Vanskelig å automatisere (ingen API uten eBays off. API med begrensninger).
- _Markedsrapporter:_ Bransjerapporter gir globale trender og bruk (f.eks. viser økt resirkulering men tall er aggregerte, ikke kule-spesifikke). God for markedsoverblikk (pålitelighet 7/10).

**Anmeldelser/Tester:**

- _MyGolfSpy Golf Ball Test (2025):_ Omfattende test av 45 modeller, med rangeringer. Spesifikasjoner og ytelse. Kan trekke navn på relevante modeller og deres egenskaper (vanskelig å scrape, men data kan man notere).
- _GolfDigest, Golf.com osv.:_ Listiker «beste baller» lister, og analyser av kuler. Også tester ulike spillertyper. Høyt nivå info (pålitelighet 8/10).
- _YouTube kanaler (Rick Shiels, TXG):_ munnlig info om demper/spinn, nesten ikke strukturerbar tekst (manuelt).

**Kompresjon & Dimple-data:**

- _Produsenter:_ Utgir sjelden konkrete kompresjonsverdi (Titleist gir ~87/97 for Pro V1/V1x). Callaway nevner «low compression» for Supersoft etc.
- _Tredjepart:_ Noen nettsteder har kompresjonskart (Golfsidekick) eller ball labs (MyGolfSpy?). Dimpletabell på _golf-info-guide.com_ listet mange modeller og dimpleantall (men denne siden kvalitet?). Kildefunn: Pro V1x 348, Titleist wiki sa «60 færre dimpler vs V1».
- _Vitenskapelige artikler:_ Svært få. Mest info via merke/testing.

**Oppsummering av kilder:** (se også «Kildekatalog»-delen under) Hver kilde får navn, URL, type info, troverdighet (1–10), API-tilgjengelighet, scrapedeteknologi, lisensforbehold. Eksempel:

- _Titleist.com (produsent)_ – tekniske spesifikasjoner, markedsføring. Troverdighet 9. Ingen offisiell API, krever tilpasset scraping. Bruk kun med sitat.
- _BreakfastBalls.Golf (blogg)_ – detaljert specs for utgaver (f.eks. 2025 Pro V1). Troverdighet 7-8 (uavhengig golfblog).
- _LostGolfBalls.com_ – bruktpriser, produktdata. Troverdighet 8 (stor aktør). Ingen API, men nettside kan parses.
- _MyGolfSpy.com_ – tester, ball lab data. Troverdighet 8 (uavhengige tester). Nettside (ingen API, men mye tekst/tabeller).
- _Wikipedia_ – historikk, kjennetegn. Troverdighet 7 (åpen wiki, kan faktasjekkes).
- _Golf-info-guide.com_ – specifisering (dimples). Troverdighet 5-6 (bloggish). Kan gi eksempler men bør dobbeltsjekkes.
- _Roboflow Universe (GolfBall)_ – datasettrelaterte bilder. Troverdighet 7 (brukerbidratt), CC-lisens (sikkert pluss).
- _Stix.golf (Rough Thoughts blog)_ – markedsinfo ( bruktpriser). Troverdighet 6-7 (instruksjonsblogg).

Tabell for kilder er oppsummert i «Kildekatalog»-delen.

# 7. Foreløpig utvalgsdatasett («Seed dataset»)

Vi prioriterer de mest vanlige og populære golfkuleversjonene i Europa og Nord-Amerika for V1 av databasen. Mål: 150–300 forskjellige **kuleversjoner** (merkefamilie + år). Vi rangerer etter sannsynlighet for at brukere har dem:

- **1–50 (høyest prioritet):** Markedsledende Tour-kuler:
  - _Titleist_ Pro V1 (alle nye generasjoner), Pro V1x, AVX (nyere Premium-variant), Tour Soft.
  - _Callaway_ Chrome Soft, Chrome Soft X, Chrome Tour, Supersoft (gul variant med), Warbird (distance).
  - _TaylorMade_ TP5, TP5x, Tour Response, Distance Plus.
  - _Srixon_ Z-Star XV, Z-Star, Q-Star Tour, Q-Star (5th gen), Soft Feel (herre/dame).
  - _Bridgestone_ Tour B XS, Tour B X, Tour B RX, Tour B RXS, e12 Speed, e12 Soft (dame).
  - _Volvik_ Chrome Tour X, Chrome Tour, VIVID (standardfarget).
  - _Vice_ Pro Plus, Pro, Drive.
  - _Wilson_ Staff Model, Duo, Duo Soft.
  - _Mizuno_ RB Tour, RB Tour X, RB 566 (og 566X).
  - _Nike_ One Platinum (20XI), One Speed (kanskje eldre utgaver).
  - _Snell_ MTB-X, MTB Black (nye Snell-modeller).

- **51–150 (middels prioritet):** Populære performance- og verdi-kuler:
  - _Titleist_ Tour Speed, Velocity, TruFeel, Tour Soft (eldre årganger).
  - _Callaway_ Chrome Soft Truvis (print), Supersoft (alle farger), Solaire (damefarget), X Halo (discontinued), HEX Dr og Warbird.
  - _TaylorMade_ Project (a) (noen versjoner av Tru, Rossa TriSoft), Noodle (langt), Big Hitter (eldre), Tour Preferred (eldre).
  - _Srixon_ Q-Star (standard, 4th gen), Trispeed, Soft Feel Lady (feminin), ZX (eldre for generiske).
  - _Bridgestone_ e6 (alle varianter), e5, e7 (mindre populære), Lady Precept.
  - _Volvik_ inneholder også fargede eksport-varianter (Oransje/Neon).
  - _Pinnacle_ Rush, Gold Distance, Soft.
  - _Top Flite_ Gamer, Distance Pro (billig).
  - _OnCore_ Vero X1, Vero X2 (nybegynner-merke).
  - _Precept_ D2 (tidl. Maxfli-dameball).
  - _Maxfli_ Revolution (Low Comp), Tour (older lines).
  - _Mizuno_ MVP, RB566V.
  - _Nike_ RZN Chrome, RZN Platinum (eldre hen).

- **151–300 (lavere prioritet):**
  - Andre nybegynner/rekreasjons- og verdi-baller (eksempel: Slazenger Raw, Dunlop Tour, Acer X og Y).
  - Spesialutgaver (trenger ikke alle, men noen representative).
  - Eldre Tour-pære som fortsatt er på bruktmarkedet (f.eks. TaylorMade Pro Project Red, Wilson Staff Fifty Elite, Tour Preferred X).
  - Evt. innkjøpskule-merker (In1, Strata gamle varianter, innkjøpte varemerker til sportsbutikker).
  - Et utvalg av «Lakeball»-merker/konvolutter (f.eks. generic grade-A Titleist/Vokser) hvis det er plass.

Listen prioriterer **merkefamilier og generasjoner**. For hver rad i det endelige datasettet ønsker vi minst: Merke, Modellnavn, Årgang, Segment (forankret i taksonomien). De 150–300 versjonene kan grupperes i en tabell med felter: Prioritet, Merke, Familie, Utgave/År, Segmentkategori. (I full rapport kan man inkludere bare topp 20–30 som eksempel og nevne at flere er listet i vedlegg).

# 8. Risikoer og usikkerheter

- **Datagap:** Ikke alle kulemodeller har lett tilgjengelig teknisk data (særlig gamle eller obskure kuler). Vi mangler enkelte interne specs (nøyaktig kjernedesign) som produsenter ikke publiserer. _Mitigering:_ Bruke offisiell eller testdata der mulig, la felt være tomme med lav konfidens inntil de kan fylles av eksperter/test.
- **Lisensiering:** Bruk av bilder og produsent-data kan være lisensbeskyttet. Direkte kopiering av bilder fra web uten tillatelse bryter opphavsrett. _Mitigering:_ Egne foto/partnerskap for bilder, bruk av data med kildehenvisning som sitater (fakta er ikke copyright-beskyttet). Data fra åpne kilder (f.eks. CC-bilder) der mulig. Vurder datadeling (public API) i framtiden med klar TOS.
- **Skrabbarbeid:** Mange nettsider hindrer automatisert skrapping (CAPTCHAs, JavaScript-drevet innhold). _Mitigering:_ Velge kilder med tilgjengelig data (f.eks. avklarte avtaler for API, manuelt hente data hvor nødvendig, bruke gode skrabeverktøy).
- **Bildebruk:** Kundeopplastede bilder (brukerne) kan inneholde logoer eller andre personlige merker som kan være beskyttet. _Mitigering:_ Tillat kun bilder av kule overflaten, sørg for brukervilkår (samtykke til å bruke bilde for gjenkjenningsformål). Man bør ikke samle metadata som identifiserer brukeren.
- **Verdivurdering:** Prognoser kan være usikre pga. variabel bruktprisutvikling, valutaendringer og motetrender. _Mitigering:_ Bruk brede intervaller (lav/mid/høy) i stedet for presise beløp, og angi usikkerhet (lav, medium, høy tillit). Oppdater modell jevnlig med ferske markedsdata.
- **AI-identifikasjon:** Risiko for feilklassifisering (f.eks. lignende logoer, uskarpe bilder). _Mitigering:_ Sørg for variert treningsdata, bruk «confidence score» i AI-resultater. Ha fallback til manuell verifisering ved lav sikkerhet. Ikke lås bruker fullstendig på et automatisk resultat – gi mulighet til å korrigere valg.
- **Personvern/GDPR:** Selv om golfkule-data i seg selv er anonymt, kan f.eks. opphavsrett/licens være en juridisk risiko. _Mitigering:_ Følg lokale lover om opphavsrett. For personlige bilder: ikke samle personlig info, gi brukerkontroll på egne bilder.

# 9. Implementeringsanbefalinger og veikart

**Database-struktur:** Implementer som beskrevet ovenfor (Brand, Family, Version, Specs, osv.), bruk et robust relasjonsDBMS (f.eks. PostgreSQL) eller NoSQL hvis mer fleksibilitet på attributter trengs. Sørg for unike ID’er og godt definerte fremmednøkler.

**API-strategi:**

- Bygg et RESTful API (eller GraphQL) som tilbyr oppslag per merke/familie/versjon. Ressurser kan være `/brands`, `/families`, `/versions`, `/versions/{id}/images`.
- Inkluder filter- og søkefunksjoner (på slagord, spesifikasjoner, segment).
- API-et bør ha versjonshåndtering (v1, v2) for bakoverkompatibilitet.
- Autentisering (API-nøkler) for utviklere, ev. brukerroller (åpen for basisdata, mer avansert med autentisert).

**Søke-strategi:**

- Tekstsøk (fritt søk i navn/familie).
- Filtrering: etter merke, dimpelantall, covertype, segment osv.
- Synonymordbok for merkenavn (noen skriver «Pro V1», «ProV1»).
- Tilby «autocomplete» i UI mot merke- og modelltabeller.

**Bildehåndtering:**

- Lagre bilder i skylagring (S3 eller lignende). Generer metadata-URL’er i DB.
- Gjør nye bilder søkbare (eks. «vis alle røde Titleist-bilder»).
- API-endepunkt for bildeopplasting (med versjons-ID). Ved opplasting skal AI-identifikasjon lokalt/innen API kontrolleres (se neste).

**Import/oppdatering:**

- Etabler datainntakspipeline (ETL) for å legge inn data fra kilder: nett-skrabbere for spesifikasjoner (alle viktige merker), importer prisdata fra LostGolfBalls/FoundGolfBalls, legg til bilder.
- Tidsplan for å oppdatere årlig (nye modeller) og månedlig (pris).
- Lag back-end-verktøy for manuell vedlikehold (f.eks. nettbrettskjema for å korrigere spesifikasjoner fra kilder).

**Fremtidig AI-strategi:**

- MVP fokuserer på tekstbasert søk og filtre. I en senere fase integreres bildegjenkjenning: bruk pre-trente nettverk til å identifisere merke/tekst i opplastede bilder, kople bildet til database-versjonen.
- Utvikle en «gjenkjenner»-mikrotjeneste: tar ett eller flere kulebilder, returnerer sannsynligste merke/familie.
- Kontinuerlig forbedring: lag crowdsourcing-algoritme der brukere retter feil gjenkjenning, dette fôrer treningsdata.
- Vurder også «API for vision»: la ekstern utvikler spørre med bilde (skille) for gjenkjenning.

**Faser (roadmap):**

- **MVP (Fase 1, 0–6 måneder):** Fokus på kjernefunksjoner: database med merke/familie/versjon, tekniske spesifikasjoner, segmenter, data fra tross (eks. Titleist, Callaway) og forsegle disse. Søk/filter-grensesnitt for tekst. Integrert prisskjema (manuelt eller start på LostGolfBalls-data). Legg til ca. 150 prioriterte versjoner (seed).
- **Fase 2 (6–12 mnd):** Utvid databasen til ~300 versjoner (inkl. mindre merker). Bygg API og enkel web-frontend med søk og detaljvisning. Importer bilder for hver kule. Implementer enkel «legg til data» backend-modul. Legg ut dokumentasjon/kildeforklaringer.
- **Fase 3 (12–18 mnd):** Legg til AI-bildegjenkjenning: ferdigstill datasett og tren modeller. Utvid API med /identify-endepunkt. Integrer bildeopplasting i UI. Begynn utvikling av verdivurderingsalgoritme (basert på eksisterende datainnsamling).
- **Fase 4 (post-MVP, 18+ mnd):** Finpuss: Brukerregistrering/–innlogging, kundetilpasset dashbord (f.eks. «mine favoritter»). Avansert filtrering (Matchende golfkule til min swing?). Åpne ekstern API for tredjepartsutviklere. Kontinuerlig datainnsamling (pris, nye utgaver). Forbedre AI: utvide med dimensjonsmåling, dimple-deteksjon, lakede-søk (å finne brukt/lakeball-markeder).

**Kanalstrategi:** Nye AI-funksjoner designes som tilleggsmoduler slik at MVP lanseres tidlig. Oppgraderinger leveres hyppig.

## Kildekatalog

| Kilde                      | Type informasjons-kilde   | Innholdstype                              | Pål. (1–10) | API           | Skrape barriere      | Lisens                      |
| -------------------------- | ------------------------- | ----------------------------------------- | ----------- | ------------- | -------------------- | --------------------------- |
| Titleist.com               | Produsent nettsted        | Produktinfo (tekstdetaljer, bilder)       | 9           | Nei           | Medium (dynamisk JS) | Copyright data; sitat mulig |
| Callawaygolf.com           | Produsent nettsted        | Produktoversikt (turballer vs nybegynner) | 9           | Nei           | Medium               | Copyright                   |
| TaylorMade.com             | Produsent nettsted        | Produktdetaljer, lanseringer              | 8           | Nei           | Medium               | Copyright                   |
| BridgestoneGolf.com        | Produsent nettsted        | Produktinfo Tour B-serien                 | 8           | Nei           | Medium               | Copyright                   |
| Srixon.com                 | Produsent nettsted        | Produktsider (Z-Star, Q-Star etc.)        | 8           | Nei           | Medium               | Copyright                   |
| MyGolfSpy (Ball Lab)       | Uavhengig test/verktøy    | Gjennomsiktighetstester, specs            | 8           | Nei           | Lav (JSON)           | Creative Commons? (sitat)   |
| BreakfastBalls.Golf        | Golfblogg/nyhet           | Detaljerte specs for nye baller           | 7           | Nei           | Lav                  | Sannsynlig fri              |
| Wikipedia (Titleist)       | Åpen encyklopedi          | Historikk, introduksjonsår                | 7           | Ja (DBpedia)  | Nei                  | Creative Commons (CC BY-SA) |
| LostGolfBalls.com          | Nettbutikk (brukte kuler) | Bruktpriser, beskrivelser                 | 8           | Nei           | Lav                  | Sannsynlig fri              |
| FoundGolfBalls.com         | Nettbutikk (brukte kuler) | Bruktpriser                               | 8           | Nei           | Lav                  | Sannsynlig fri              |
| AceGolfBalls.com (UK)      | Nettbutikk (brukte kuler) | Priser på resirkulerte kuler              | 7           | Nei           | Lav                  | Sannsynlig fri              |
| GolfChannel/GolfDigest     | Nettmagasiner             | Anmeldelser, guides, anbefalinger         | 7           | Nei           | Ingen                | Copyright                   |
| Stix.Golf (Rough Thoughts) | Instruksjonsblogg         | Bruktkule-guide (priser, segregering)     | 6           | Nei           | Ingen                | Creative Commons?           |
| Golf-Info-Guide.com        | Golftips-blogg            | Dimple-tabell                             | 5           | Nei           | Ingen (ren HTML)     | Ukjent (må brukes kritisk)  |
| BusinessResearchInsights   | Markedsrapport            | Markedstrender/segmenter                  | 7           | Nei           | Nei                  | Beskyttet (krev kjøp)       |
| Roboflow Universe          | Åpne datasett             | Golfballbilder (deteksjon)                | 7           | Nei           | Nei                  | CC BY 4.0                   |
| Ebay.com / Amazon.com      | Handelsplattformer        | Prisobservasjoner, bilder (API til eBay)  | 6           | Ja (eBay API) | Medium               | Bruksvilkår                 |
| GolfballMonky.com et al    | Omtalesider/forhandlere   | Produktbeskrivelser                       | 6           | Nei           | Ingen                | Sannsynlig fri              |

## Seed-datasett anbefaling

Prioriterte modeller (eksempel på de 30 øverste):

| Prioritet | Merke       | Familie/Modell         | Utgave/År | Segment      |
| --------- | ----------- | ---------------------- | --------- | ------------ |
| 1         | Titleist    | Pro V1                 | 2025      | Tour/Premium |
| 2         | Titleist    | Pro V1x                | 2025      | Tour/Premium |
| 3         | Titleist    | AVX                    | 2025      | Performance  |
| 4         | Callaway    | Chrome Soft            | 2024/25   | Tour/Premium |
| 5         | Callaway    | Chrome Soft Triple Trk | 2024      | Tour/Premium |
| 6         | Callaway    | Chrome Tour            | 2024      | Performance  |
| 7         | TaylorMade  | TP5                    | 2025      | Tour/Premium |
| 8         | TaylorMade  | TP5x                   | 2025      | Tour/Premium |
| 9         | TaylorMade  | Tour Response          | 2024      | Performance  |
| 10        | Srixon      | Z-Star XV              | 2024/25   | Tour/Premium |
| 11        | Srixon      | Z-Star                 | 2024/25   | Tour/Premium |
| 12        | Srixon      | Q-Star Tour            | 2024      | Performance  |
| 13        | Bridgestone | Tour B XS              | 2023      | Tour/Premium |
| 14        | Bridgestone | Tour B X               | 2023      | Tour/Premium |
| 15        | Bridgestone | Tour B RX/RXS          | 2023      | Performance  |
| 16        | Volvik      | Chrome Tour X          | 2023      | Tour/Premium |
| 17        | Volvik      | Chrome Tour            | 2023      | Tour/Premium |
| 18        | Vice        | Pro Plus               | 2023      | Tour/Premium |
| 19        | Vice        | Drive                  | 2023      | Distance     |
| 20        | Wilson      | Staff Model            | 2023      | Tour/Premium |
| 21        | Mizuno      | RB Tour                | 2023      | Tour/Premium |
| 22        | Nike        | One Platinum (20XI)    | 2014\*    | Tour/Premium |
| 23        | Nike        | One RZN Black          | 2016\*    | Tour/Premium |
| 24        | Snell       | MTB-X                  | 2023      | Performance  |
| 25        | Snell       | MTB Black              | 2023      | Performance  |
| 26        | Callaway    | SuperSoft              | 2022      | Soft Feel    |
| 27        | Titleist    | Velocity               | 2023      | Distance     |
| 28        | Callaway    | Warbird                | 2020      | Distance     |
| 29        | TaylorMade  | Distance Plus          | 2020      | Distance     |
| 30        | Srixon      | Soft Feel              | 2023      | Soft Feel    |

_(_) Nike avsluttet golfballproduksjon på midten av 2010-tallet, men modellene er fortsatt populære brukt.

Tabellen bør bygges videre til ~200 versjoner med tilsvarende inndeling.

## MVP og AI-veikart

**MVP (Minimum Viable Product):** Fokus på kjernetjenester:

- Fullstendig database med sentrale merke-familie-versjoner (minst 150).
- Web/API der brukere kan søke/filtere på ballspesifikasjoner og se detaljer (visuals + tekst).
- Prisinfo (ny-/bruktspekter) for store modeller.
- Grunnleggende segmentering og tags (merke, segment).
- Grunnleggende bildegalleri per ball (produsentbilder).

**Post-MVP-funksjoner:**

- Brukergenerert innhold (logg inn og legg til bild).
- Avansert AI-søk: Bruk bildegjenkjenning for å identifisere kule fra et bilde.
- Utvidet søk: Funksjoner som «vis lignende kuler» basert på teknikk og pris.
- Åpent API: Gi tredjepartsutviklere tilgang til kuledata (med rate-limits).

**AI-veikart:**

- _Fase A:_ Bygg bildeklassifiseringsmodellen med datasettet vårt. Tren resnet/vision-transformer til å gjenkjenne merke/modell.
- _Fase B:_ Integrer lokaliseringsmodell (f.eks. YOLO) for å finne logo/tekst i brukeropplastninger. Kombiner klassifisering av fragmenter med full bildeklassifisering for robusthet.
- _Fase C:_ Toveis-læring: Bruk kundetilbakemeldinger (rettelser) for å forbedre modellen.
- _Fase D:_ Analyser dimple-mønstre ved hjelp av CNN (avansert) – kan brukes til å bekrefte modell.
- _Fase E:_ Undersøk generative modeller (f.eks. GPU-versjoner) som kan lage syntetiske bilder for sjeldne modeller.

Gjennom alle faser må vi dokumentere datakilder nøye, validere data (dobbeltsjekke nyere utgaver) og alltid sitere kildene (se liste).

**Konklusjon:** Dette rammeverket gir et solid grunnlag for en fremtidig Golfkule-registreringsplattform. Alle spesifikke påstander og tekniske data vil følges opp med kildehenvisninger som vist. Vår strategi vektlegger pålitelig datainnsamling, skalerbar databasedesign og en utviklingsplan i trinn med tidlig lansering av kjernefunksjonalitet. Gjennom dette sikrer vi både detaljrikdom og fleksibilitet for videre funksjonsutvidelser og AI-integrasjon.
