# Correção dos botões de expediente

Foi corrigido um erro de sintaxe em `js/supabase-sync.js` que interrompia
a inicialização do JavaScript do painel. Por isso os botões apareciam,
mas não respondiam, e o cabeçalho permanecia em **Modo local**.

Também foi atualizado o cache do service worker para a versão `v2`.

## Depois de substituir a pasta

1. Pare o servidor com `Ctrl + C`.
2. Execute novamente `npx serve .`.
3. Abra `http://localhost:3000/`.
4. Pressione `Ctrl + Shift + R`.
5. Caso ainda apareça a versão antiga, limpe os dados do site de
   `localhost:3000` e abra novamente.

As migrações 05 e 06 já executadas no Supabase não precisam ser repetidas.
