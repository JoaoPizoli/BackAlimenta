# Pasta de Dados - CSV TACO

## Instruções

Coloque o arquivo CSV da tabela TACO nesta pasta com o nome `taco.csv`.

### Formato esperado do CSV:

O sistema irá mapear automaticamente as seguintes colunas (aceita variações de nome):

- **codigo** / **Codigo**: Código do alimento
- **nome** / **Nome** / **alimento** / **Alimento**: Nome do alimento
- **calorias** / **Energia** / **energia**: Valor energético (kcal)
- **proteinas** / **Proteina** / **proteina**: Proteínas (g)
- **carboidratos** / **Carboidrato** / **carboidrato**: Carboidratos (g)
- **gordura** / **Lipidio** / **lipidio**: Gorduras (g)
- **fibra** / **Fibra**: Fibras (g)
- **calcio** / **Calcio**: Cálcio (mg)
- **ferro** / **Ferro**: Ferro (mg)
- **sodio** / **Sodio**: Sódio (mg)
- **categoria** / **Categoria**: Categoria do alimento

### Exemplo de cabeçalho CSV:
```
codigo,nome,calorias,proteinas,carboidratos,gordura,fibra,calcio,ferro,sodio,categoria
```

### Notas:
- Se o arquivo não for encontrado, o sistema criará dados de exemplo para teste
- O banco SQLite in-memory será recriado a cada inicialização do servidor
- As consultas de alimentos serão extremamente rápidas por estarem em memória
