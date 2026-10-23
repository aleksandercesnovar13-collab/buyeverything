# BuyEverything — spletna trgovina (React + Vite + Supabase)

Slovenska, odzivna trgovina z registracijo/prijavo, potrjevanjem e-pošte prek Supabase Auth, iskanjem, kategorijami, razvrščanjem, priljubljenimi izdelki in košarico. Košarica in priljubljeni izdelki se shranijo v brskalniku.

## Kaj je vključeno

- Registracija z imenom, e-pošto in geslom (najmanj 8 znakov).
- Potrditvena povezava, ponovna pošiljka potrditve, prijava, ponastavitev gesla in odjava prek Supabase Auth.
- Iskanje, kategorije, razvrščanje po ceni/oceni, priljubljeni izdelki.
- Košarica s količinami, izračunom vmesnega seštevka in prikazom dostave; brezplačna dostava je v predstavitvi nastavljena nad 60 €.
- Odziven prikaz za telefon in namizni računalnik.
- Blagajna z obrazcem za podatke za dostavo, ki je namenoma označena kot nepriključena.

## Pomembno pred pravo prodajo

To je funkcionalna osnova uporabniškega vmesnika, **ne še popolna produkcijska trgovina**. Izdelki in cene so vzorčni. Blagajna trenutno ne odda naročila in ne sprejme plačila. Pred sprejemanjem kupcev je treba povezati strežniško bazo izdelkov in naročil, preverjanje zaloge/cen na strežniku, dostavo, davke, plačilnega ponudnika, e-poštna obvestila, pravne strani (pogoji, zasebnost, vračila), piškotke po potrebi ter varnostne politike baze. Ne zbiraj ali obdeluj pravih naročil, dokler te povezave niso izvedene in preizkušene.

## 1. Lokalni zagon

Namesti trenutno LTS različico Node.js, nato v tej mapi zaženi:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

## 2. Povezava Supabase Auth

1. Ustvari projekt na https://supabase.com/.
2. V Supabase najdi Project URL in javni anon/publishable ključ.
3. V `.env.local` nastavi:

```dotenv
VITE_SUPABASE_URL=https://TVOJ-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=tvoj-javni-anon-ali-publishable-kljuc
```

4. V **Authentication → Providers → Email** omogoči potrjevanje e-pošte.
5. V **Authentication → URL Configuration** nastavi Site URL na točno produkcijsko domeno in med Redirect URLs dodaj lokalni naslov ter produkcijsko domeno (npr. `http://localhost:5173/**` in `https://tvoja-domena.si/**`). Uporabi dejansko domeno svoje trgovine.
6. V **Authentication → Email Templates** preveri predlogo za potrditev registracije in povezavo Supabase.
7. Za zanesljivo pošiljanje e-pošte v produkciji nastavi lasten SMTP ponudnik v Supabase. Privzeto pošiljanje ima omejitve.
8. Po spremembi `.env.local` ponovno zaženi Vite.

**Nikoli ne vstavljaj Supabase `service_role` ključa v frontend, `.env` za Vite ali javni repozitorij.** Odjemalec sme vsebovati samo javni anon/publishable ključ, podatke pa je treba zaščititi s pravilnimi RLS pravili.

## 3. Objavi spletno stran

Projekt lahko objaviš na Vercel, Netlify ali drugem ponudniku za statične React/Vite strani. Nastavi build ukaz `npm run build` in output mapo `dist`. V nastavitvah okolja ponudnika dodaj `VITE_SUPABASE_URL` in `VITE_SUPABASE_ANON_KEY`, nato ponovno objavi. Pri SPA gostovanju nastavi preusmeritev neznanih poti na `index.html`, če jo ponudnik zahteva.

Ko poznaš pravo domeno, jo dodaj tudi v Supabase Redirect URLs. Če mi pošlješ povezavo do objavljene trgovine in poveš, kje gostuje, ti lahko pripravim točne korake za tvojo nastavitev.

## 4. Pred zagonom za kupce — kontrolni seznam

- [ ] Zamenjaj vzorčne izdelke/cene z dejanskimi in jih shrani v bazo.
- [ ] Poveži varno strežniško oddajo naročila; cena in zaloga morata biti preverjeni na strežniku, ne v brskalniku.
- [ ] Poveži plačila prek ponudnika (npr. Stripe ali drug podprt ponudnik); skrivni ključi morajo ostati na strežniku.
- [ ] Nastavi dostavne načine, stroške, davke, vračila in e-poštna obvestila.
- [ ] Objavi pravilnik zasebnosti, pogoje, podatke prodajalca in politiko vračil v skladu z veljavnimi predpisi.
- [ ] Preizkusi registracijo, potrditveno e-pošto, prijavo, ponastavitev gesla in odjavo na produkcijski domeni.
- [ ] Dodaj testne izdelke in izvedi testno naročilo/plačilo v testnem okolju plačilnega ponudnika.