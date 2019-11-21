Aby uruchomić, utwórz plik .env o podanej strukturze:
<code>
  GITHUB_KEY=TWOJ_TOKEN
  PORT=WYBRANY_PORT
  CLONED_REPOS_DIR=NAZWA_FOLDERU_NA_REPOZYTORIA
</code>

Przykładowo:
<code>
  GITHUB_KEY=aaaaaaaaabbbbbbbbbbbbbcccccc214124
  PORT=30000
  CLONED_REPOS=cloned_repos
</code>

Po pobraniu należy jeszcze zainstalować dependencje <code>npm i</code>
Uruchamiamy <code>npm start</code>

Endpointy:
* /dependencies/author/WYBRANY_GITHUB_USER (polecam sprawdzać mój nick, tam jest wszystko w miarę stabilne) - tagi i biblioteki uzywane przez uzytkownika (nalezy raczej sie skupic na tym co sie dzieje w kodzie, np. za pomoca debuggera, poniewaz sama zwracana informacja nie jest zbytnio przydatna)
* /git/analyse/WYBRANY_GITHUB_USER - (WIP) j.w. ale osiagniete za pomoca klonowania repo

